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

    async createBackup() {
        try {
            const scriptPath = path.join(this.scriptsDir, 'backup-all.sh');
            const { stdout, stderr } = await execAsync(`"${scriptPath}"`);
            return { stdout, stderr };
        } catch (error) {
            throw new InternalServerErrorException(`Backup failed: ${error.message}`);
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
}
