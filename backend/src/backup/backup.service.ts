import { Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import * as util from 'util';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CloudStorageService } from './cloud-storage.service';

const execAsync = util.promisify(exec);

@Injectable()
export class BackupService {
    private readonly logger = new Logger(BackupService.name);
    private readonly scriptsDir = path.resolve(process.cwd(), '../scripts/db-backups/local');
    private readonly backupsDir = path.resolve(process.cwd(), '../backups');
    private readonly prismaDir = path.resolve(process.cwd(), 'prisma');

    constructor(
        private readonly cloudStorageService: CloudStorageService
    ) { }

    /**
     * Detect database type from DATABASE_URL environment variable
     */
    private getDatabaseType(): 'sqlite' | 'mysql' | 'postgresql' {
        const dbUrl = process.env.DATABASE_URL || '';
        if (dbUrl.startsWith('file:')) return 'sqlite';
        if (dbUrl.includes('mysql')) return 'mysql';
        return 'postgresql';
    }

    /**
     * Parse MySQL connection details from DATABASE_URL
     */
    private getMysqlConnectionDetails(): { host: string; port: string; user: string; password: string; database: string } {
        const dbUrl = process.env.DATABASE_URL || '';
        // Format: mysql://user:password@host:port/database
        const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
        if (!match) {
            throw new Error('Invalid MySQL DATABASE_URL format');
        }
        return {
            user: match[1],
            password: match[2],
            host: match[3],
            port: match[4],
            database: match[5],
        };
    }

    /**
     * Get the SQLite database file path from DATABASE_URL
     */
    private getSqliteDbPath(): string {
        const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
        // DATABASE_URL format: file:./dev.db or file:./prisma/dev.db
        const relativePath = dbUrl.replace('file:', '').replace('./', '');
        // The path is relative to the prisma directory or current directory
        const possiblePaths = [
            path.join(this.prismaDir, relativePath),
            path.join(process.cwd(), relativePath),
            path.join(this.prismaDir, 'dev.db'),
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }
        return possiblePaths[0]; // Default to first option
    }

    /**
     * Run every hour to check if a backup is scheduled
     */
    @Cron(CronExpression.EVERY_HOUR)
    async handleCron() {
        this.logger.log('Checking for scheduled backups...');
        const settings = await this.cloudStorageService.getSettings();

        if (!settings.autoBackup) {
            return;
        }

        // Check time match
        const now = new Date();
        const currentHour = now.getHours().toString().padStart(2, '0');
        const [targetHour] = (settings.backupTime || '02:00').split(':');

        // Only run if the hour matches (ignore minutes for hourly cron)
        if (currentHour === targetHour) {
            this.logger.log(`Starting scheduled backup for time ${settings.backupTime}`);
            try {
                // 1. Create Backup (Auto-syncs to cloud if enabled)
                await this.createBackup();

                // 2. TODO: Prune old backups based on retentionDays
            } catch (error) {
                this.logger.error('Scheduled backup failed', error.stack);
            }
        }
    }

    async createBackup() {
        const dbType = this.getDatabaseType();
        let result: any;

        try {
            if (dbType === 'sqlite') {
                result = await this.createSqliteBackup();
            } else if (dbType === 'mysql') {
                result = await this.createMysqlBackup();
            } else {
                // For PostgreSQL, try shell scripts as fallback
                const scriptPath = path.join(this.scriptsDir, 'backup-all.sh');
                const { stdout, stderr } = await execAsync(`"${scriptPath}"`);
                result = { stdout, stderr, success: true };
            }

            // AUTO-SYNC Check
            if (result && result.success) {
                try {
                    const settings = await this.cloudStorageService.getSettings();
                    if (settings.gdriveEnabled) {
                        // 1. Sync Database Backup
                        if (result.filename) {
                            this.logger.log(`Auto-syncing database ${result.filename} to Google Drive...`);
                            await this.cloudStorageService.uploadBackup(result.filename, 'database');
                            this.logger.log('Database auto-sync complete.');
                        }

                        // 2. Sync Files Backup
                        if (result.filesBackupFilename) {
                            this.logger.log(`Auto-syncing files ${result.filesBackupFilename} to Google Drive...`);
                            await this.cloudStorageService.uploadBackup(result.filesBackupFilename, 'files');
                            this.logger.log('Files auto-sync complete.');
                        }

                        result.synced = true;
                    }
                } catch (syncError) {
                    this.logger.error('Auto-sync to cloud failed', syncError.stack);
                    // Don't fail the main backup creation, just log the sync failure
                    result.synced = false;
                    result.syncError = syncError.message;
                }
            }

            return result;

        } catch (error) {
            throw new InternalServerErrorException(`Backup failed: ${error.message}`);
        }
    }

    /**
     * Create a backup for MySQL database using mysqldump
     */
    private async createMysqlBackup() {
        try {
            const conn = this.getMysqlConnectionDetails();

            // Create backup directories
            const dbBackupDir = path.join(this.backupsDir, 'database');
            const filesBackupDir = path.join(this.backupsDir, 'files');

            if (!fs.existsSync(dbBackupDir)) {
                fs.mkdirSync(dbBackupDir, { recursive: true });
            }
            if (!fs.existsSync(filesBackupDir)) {
                fs.mkdirSync(filesBackupDir, { recursive: true });
            }

            // Generate timestamp for backup filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const backupFilename = `school_db_${timestamp}.sql`;
            const backupPath = path.join(dbBackupDir, backupFilename);

            // Run mysqldump (with flags to avoid privilege issues on restore)
            const mysqldumpCmd = `mysqldump --no-tablespaces --set-gtid-purged=OFF --skip-lock-tables -h ${conn.host} -P ${conn.port} -u ${conn.user} -p${conn.password} ${conn.database} > "${backupPath}"`;
            await execAsync(mysqldumpCmd);

            // Also backup uploads folder if it exists
            const uploadsDir = path.join(process.cwd(), 'uploads');
            if (fs.existsSync(uploadsDir)) {
                const uploadsBackupFilename = `uploads_${timestamp}.tar.gz`;
                const uploadsBackupPath = path.join(filesBackupDir, uploadsBackupFilename);

                // Create tar.gz archive
                try {
                    await execAsync(`tar -czf "${uploadsBackupPath}" -C "${process.cwd()}" uploads`);
                } catch (tarError) {
                    console.warn('tar command failed, falling back to directory copy:', tarError.message);
                    // Fallback for systems without tar
                    const uploadsBackupDir = path.join(filesBackupDir, `uploads_${timestamp}`);
                    await this.copyDirectory(uploadsDir, uploadsBackupDir);
                }
            }

            const stats = await fs.promises.stat(backupPath);
            const sizeKB = Math.round(stats.size / 1024);

            return {
                stdout: `MySQL backup created successfully!\nFile: ${backupFilename}\nSize: ${sizeKB} KB`,
                stderr: '',
                success: true,
                filename: backupFilename,
                filesBackupFilename: fs.existsSync(path.join(filesBackupDir, `uploads_${timestamp}.tar.gz`)) ? `uploads_${timestamp}.tar.gz` : null,
                path: backupPath
            };
        } catch (error) {
            throw new InternalServerErrorException(`MySQL backup failed: ${error.message}`);
        }
    }

    /**
     * Create a backup for SQLite database by copying the .db file
     */
    private async createSqliteBackup() {
        try {
            const dbPath = this.getSqliteDbPath();

            if (!fs.existsSync(dbPath)) {
                throw new InternalServerErrorException(`SQLite database not found at: ${dbPath}`);
            }

            // Create backup directories
            const dbBackupDir = path.join(this.backupsDir, 'database');
            const filesBackupDir = path.join(this.backupsDir, 'files');

            if (!fs.existsSync(dbBackupDir)) {
                fs.mkdirSync(dbBackupDir, { recursive: true });
            }
            if (!fs.existsSync(filesBackupDir)) {
                fs.mkdirSync(filesBackupDir, { recursive: true });
            }

            // Generate timestamp for backup filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const backupFilename = `school_db_${timestamp}.db`;
            const backupPath = path.join(dbBackupDir, backupFilename);

            // Copy the SQLite database file
            await fs.promises.copyFile(dbPath, backupPath);

            // Also backup uploads folder if it exists
            const uploadsDir = path.join(process.cwd(), 'uploads');
            if (fs.existsSync(uploadsDir)) {
                const uploadsBackupFilename = `uploads_${timestamp}.tar.gz`;
                const uploadsBackupPath = path.join(filesBackupDir, uploadsBackupFilename);

                // Create tar.gz archive
                try {
                    await execAsync(`tar -czf "${uploadsBackupPath}" -C "${process.cwd()}" uploads`);
                } catch (tarError) {
                    console.warn('tar command failed, falling back to directory copy:', tarError.message);
                    // Fallback for systems without tar
                    const uploadsBackupDir = path.join(filesBackupDir, `uploads_${timestamp}`);
                    await this.copyDirectory(uploadsDir, uploadsBackupDir);
                }
            }

            const stats = await fs.promises.stat(backupPath);
            const sizeKB = Math.round(stats.size / 1024);

            return {
                stdout: `SQLite backup created successfully!\nFile: ${backupFilename}\nSize: ${sizeKB} KB`,
                stderr: '',
                success: true,
                filename: backupFilename,
                filesBackupFilename: fs.existsSync(path.join(filesBackupDir, `uploads_${timestamp}.tar.gz`)) ? `uploads_${timestamp}.tar.gz` : null,
                path: backupPath
            };
        } catch (error) {
            throw new InternalServerErrorException(`SQLite backup failed: ${error.message}`);
        }
    }

    /**
     * Helper to copy a directory recursively
     */
    private async copyDirectory(src: string, dest: string) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        const entries = await fs.promises.readdir(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.promises.copyFile(srcPath, destPath);
            }
        }
    }

    async listBackups() {
        try {
            const dbDir = path.join(this.backupsDir, 'database');
            const filesDir = path.join(this.backupsDir, 'files');

            const databases = await this.getFiles(dbDir);
            const files = await this.getFiles(filesDir);

            return { database: databases, files: files };
        } catch (error) {
            // If directories don't exist yet, return empty
            return { database: [], files: [] };
        }
    }

    private async getFiles(dir: string) {
        if (!fs.existsSync(dir)) return [];

        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        const fileStats = await Promise.all(
            entries
                .filter(entry => entry.isFile() && !entry.name.startsWith('.'))
                .map(async (entry) => {
                    const filePath = path.join(dir, entry.name);
                    const stats = await fs.promises.stat(filePath);
                    return {
                        name: entry.name,
                        size: stats.size,
                        date: stats.mtime,
                        path: filePath
                    };
                })
        );
        // Sort by date desc
        return fileStats.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    async getBackupPath(type: string, filename: string) {
        const dir = type === 'database'
            ? path.join(this.backupsDir, 'database')
            : path.join(this.backupsDir, 'files');

        const filePath = path.join(dir, filename);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('Backup file not found');
        }
        return filePath;
    }

    async deleteBackup(type: 'database' | 'files', filename: string) {
        const dir = type === 'database'
            ? path.join(this.backupsDir, 'database')
            : path.join(this.backupsDir, 'files');

        const filePath = path.join(dir, filename);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('Backup file not found');
        }

        await fs.promises.unlink(filePath);
        return { deleted: true, filename };
    }

    async restoreBackup(filename: string, type: 'database' | 'files') {
        const dbType = this.getDatabaseType();

        if (dbType === 'sqlite' && type === 'database') {
            return this.restoreSqliteBackup(filename);
        }

        if (dbType === 'mysql' && type === 'database') {
            return this.restoreMysqlBackup(filename);
        }

        // Handle file restores (tar.gz archives)
        if (type === 'files') {
            return this.restoreFilesBackup(filename);
        }

        // For PostgreSQL, use shell scripts
        const scriptName = 'restore-database.sh';
        const backupPath = path.join(this.backupsDir, 'database', filename);

        if (!fs.existsSync(backupPath)) {
            throw new NotFoundException('Backup file not found');
        }

        try {
            const scriptPath = path.join(this.scriptsDir, scriptName);
            // We now use the -y flag for non-interactive execution
            const { stdout, stderr } = await execAsync(`"${scriptPath}" -y "${backupPath}"`);
            return { stdout, stderr };
        } catch (error) {
            throw new InternalServerErrorException(`Restore failed: ${error.message}`);
        }
    }

    /**
     * Restore files from a tar.gz backup
     */
    private async restoreFilesBackup(filename: string) {
        const backupPath = path.join(this.backupsDir, 'files', filename);

        if (!fs.existsSync(backupPath)) {
            throw new NotFoundException('Backup file not found');
        }

        try {
            const uploadsDir = path.join(process.cwd(), 'uploads');

            // Create a backup of current uploads before restoring
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            if (fs.existsSync(uploadsDir)) {
                const currentBackupPath = path.join(this.backupsDir, 'files', `pre_restore_uploads_${timestamp}.tar.gz`);
                await execAsync(`tar -czf "${currentBackupPath}" -C "${process.cwd()}" uploads`);
            }

            // Extract the backup (tar.gz files)
            if (filename.endsWith('.tar.gz') || filename.endsWith('.tgz')) {
                await execAsync(`tar -xzf "${backupPath}" -C "${process.cwd()}"`);
            } else if (filename.endsWith('.tar')) {
                await execAsync(`tar -xf "${backupPath}" -C "${process.cwd()}"`);
            } else {
                throw new InternalServerErrorException('Unsupported backup format. Expected .tar.gz or .tar');
            }

            return {
                stdout: `Files restored successfully from: ${filename}`,
                stderr: '',
                success: true,
            };
        } catch (error) {
            throw new InternalServerErrorException(`File restore failed: ${error.message}`);
        }
    }

    /**
     * Restore a MySQL database from backup
     */
    private async restoreMysqlBackup(filename: string) {
        try {
            const backupPath = path.join(this.backupsDir, 'database', filename);

            if (!fs.existsSync(backupPath)) {
                throw new NotFoundException('Backup file not found');
            }

            const conn = this.getMysqlConnectionDetails();

            // Create a pre-restore backup first
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const preRestoreFilename = `pre_restore_${timestamp}.sql`;
            const preRestorePath = path.join(this.backupsDir, 'database', preRestoreFilename);
            const mysqldumpCmd = `mysqldump --no-tablespaces --set-gtid-purged=OFF --skip-lock-tables -h ${conn.host} -P ${conn.port} -u ${conn.user} -p${conn.password} ${conn.database} > "${preRestorePath}"`;
            await execAsync(mysqldumpCmd);

            // Restore the backup (filter out statements requiring SUPER privileges)
            const mysqlCmd = `sed -e 's/DEFINER[ ]*=[ ]*[^*]*\\*/\\*/' -e 's/DEFINER[ ]*=.*FUNCTION/FUNCTION/' -e 's/DEFINER[ ]*=.*PROCEDURE/PROCEDURE/' -e 's/DEFINER[ ]*=.*TRIGGER/TRIGGER/' -e 's/DEFINER[ ]*=.*VIEW/VIEW/' -e 's/SET @@SESSION.SQL_LOG_BIN.*//' -e 's/SET @@GLOBAL.GTID_PURGED.*//' "${backupPath}" | mysql -h ${conn.host} -P ${conn.port} -u ${conn.user} -p${conn.password} ${conn.database}`;
            await execAsync(mysqlCmd);

            return {
                stdout: `MySQL database restored successfully from: ${filename}\nPre-restore backup saved as: ${preRestoreFilename}`,
                stderr: '',
                success: true
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(`MySQL restore failed: ${error.message}`);
        }
    }

    /**
     * Restore a SQLite database from backup
     */
    private async restoreSqliteBackup(filename: string) {
        try {
            const backupPath = path.join(this.backupsDir, 'database', filename);

            if (!fs.existsSync(backupPath)) {
                throw new NotFoundException('Backup file not found');
            }

            const dbPath = this.getSqliteDbPath();

            // Create a backup of current database before restoring
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const preRestoreBackup = dbPath + `.pre-restore-${timestamp}`;

            if (fs.existsSync(dbPath)) {
                await fs.promises.copyFile(dbPath, preRestoreBackup);
            }

            // Restore the backup
            await fs.promises.copyFile(backupPath, dbPath);

            return {
                stdout: `SQLite database restored successfully from: ${filename}\nPre-restore backup saved as: ${path.basename(preRestoreBackup)}`,
                stderr: '',
                success: true
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(`SQLite restore failed: ${error.message}`);
        }
    }
}
