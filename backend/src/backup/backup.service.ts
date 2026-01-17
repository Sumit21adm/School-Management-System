import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import * as util from 'util';

const execAsync = util.promisify(exec);

@Injectable()
export class BackupService {
    private readonly scriptsDir = path.resolve(process.cwd(), '../scripts');
    private readonly backupsDir = path.resolve(process.cwd(), '../backups');
    private readonly prismaDir = path.resolve(process.cwd(), 'prisma');

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

    async createBackup() {
        const dbType = this.getDatabaseType();

        if (dbType === 'sqlite') {
            return this.createSqliteBackup();
        }

        // For MySQL/PostgreSQL, use shell scripts
        try {
            const scriptPath = path.join(this.scriptsDir, 'backup-all.sh');
            const { stdout, stderr } = await execAsync(`"${scriptPath}"`);
            return { stdout, stderr };
        } catch (error) {
            throw new InternalServerErrorException(`Backup failed: ${error.message}`);
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
                const uploadsBackupFilename = `uploads_${timestamp}.tar`;
                const uploadsBackupPath = path.join(filesBackupDir, uploadsBackupFilename);

                // On Windows, we'll just copy the folder instead of creating tar
                const uploadsBackupDir = path.join(filesBackupDir, `uploads_${timestamp}`);
                await this.copyDirectory(uploadsDir, uploadsBackupDir);
            }

            const stats = await fs.promises.stat(backupPath);
            const sizeKB = Math.round(stats.size / 1024);

            return {
                stdout: `SQLite backup created successfully!\nFile: ${backupFilename}\nSize: ${sizeKB} KB`,
                stderr: '',
                success: true,
                filename: backupFilename,
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

        const files = await fs.promises.readdir(dir);
        const fileStats = await Promise.all(
            files
                .filter(f => !f.startsWith('.'))
                .map(async (file) => {
                    const filePath = path.join(dir, file);
                    const stats = await fs.promises.stat(filePath);
                    return {
                        name: file,
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

    async restoreBackup(filename: string, type: 'database' | 'files') {
        const dbType = this.getDatabaseType();

        if (dbType === 'sqlite' && type === 'database') {
            return this.restoreSqliteBackup(filename);
        }

        // For MySQL/PostgreSQL or file restores, use shell scripts
        const scriptName = type === 'database' ? 'restore-database.sh' : 'restore-files.sh';
        const subDir = type === 'database' ? 'database' : 'files';
        const backupPath = path.join(this.backupsDir, subDir, filename);

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
