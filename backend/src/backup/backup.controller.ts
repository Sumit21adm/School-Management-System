import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import { CloudStorageService } from './cloud-storage.service';
import type { Response } from 'express';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { UserRole } from '@prisma/client';

@Controller('backup')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class BackupController {
    constructor(
        private readonly backupService: BackupService,
        private readonly cloudStorageService: CloudStorageService,
    ) { }

    // ============================================
    // LOCAL BACKUP ENDPOINTS
    // ============================================

    @Post('create')
    // @Roles(UserRole.SUPER_ADMIN)
    async createBackup() {
        try {
            const result = await this.backupService.createBackup();
            return { success: true, message: 'Backup created successfully', data: result };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('list')
    // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    async listBackups() {
        const backups = await this.backupService.listBackups();

        // Add cloud sync status to each backup
        const addCloudStatus = async (files: any[]) => {
            return Promise.all(files.map(async (file) => ({
                ...file,
                synced: await this.cloudStorageService.isBackupSynced(file.name),
            })));
        };

        return {
            database: await addCloudStatus(backups.database || []),
            files: await addCloudStatus(backups.files || []),
        };
    }

    @Get('download/:type/:filename')
    // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    async downloadBackup(
        @Param('type') type: string,
        @Param('filename') filename: string,
        @Res() res: Response,
    ) {
        const filePath = await this.backupService.getBackupPath(type, filename);
        res.download(filePath);
    }

    @Post('restore')
    // @Roles(UserRole.SUPER_ADMIN)
    async restoreBackup(@Body() body: { filename: string; type: 'database' | 'files' }) {
        if (!body.filename || !body.type) {
            throw new HttpException('Filename and type are required', HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.backupService.restoreBackup(body.filename, body.type);
            return { success: true, message: 'Restore process started', data: result };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Delete(':type/:filename')
    // @Roles(UserRole.SUPER_ADMIN)
    async deleteBackup(
        @Param('type') type: 'database' | 'files',
        @Param('filename') filename: string,
    ) {
        try {
            await this.backupService.deleteBackup(type, filename);
            // Also delete from cloud if synced
            await this.cloudStorageService.deleteCloudBackup(filename);
            return { success: true, message: 'Backup deleted successfully' };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ============================================
    // CLOUD / GOOGLE DRIVE ENDPOINTS
    // ============================================

    @Get('cloud/status')
    async getCloudStatus() {
        return this.cloudStorageService.getStatus();
    }

    @Get('cloud/credentials')
    async getCredentials() {
        return this.cloudStorageService.getCredentials();
    }

    @Post('cloud/credentials')
    async saveCredentials(@Body() body: {
        clientId: string;
        clientSecret: string;
        redirectUri?: string;
    }) {
        if (!body.clientId || !body.clientSecret) {
            throw new HttpException('Client ID and Client Secret are required', HttpStatus.BAD_REQUEST);
        }
        try {
            await this.cloudStorageService.saveCredentials(body);
            return { success: true, message: 'Google OAuth credentials saved (encrypted)' };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Delete('cloud/credentials')
    async clearCredentials() {
        try {
            await this.cloudStorageService.clearCredentials();
            return { success: true, message: 'Google OAuth credentials cleared' };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('cloud/auth-url')
    async getAuthUrl() {
        try {
            const url = await this.cloudStorageService.getAuthUrl();
            return { url };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Get('cloud/callback')
    async handleCallback(@Query('code') code: string, @Res() res: Response) {
        // Frontend URL - adjust if using different port
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        if (!code) {
            res.redirect(`${frontendUrl}/settings/backup?error=Authorization%20code%20missing`);
            return;
        }
        try {
            await this.cloudStorageService.handleCallback(code);
            // Redirect back to the backup page with success message
            res.redirect(`${frontendUrl}/settings/backup?connected=true`);
        } catch (error) {
            res.redirect(`${frontendUrl}/settings/backup?error=` + encodeURIComponent(error.message));
        }
    }

    @Post('cloud/sync/:type/:filename')
    async syncToCloud(
        @Param('type') type: 'database' | 'files',
        @Param('filename') filename: string,
    ) {
        try {
            const result = await this.cloudStorageService.uploadBackup(filename, type);
            return {
                success: true,
                message: 'Backup synced to Google Drive',
                data: result
            };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('cloud/list')
    async listCloudBackups() {
        return this.cloudStorageService.listCloudBackups();
    }

    @Delete('cloud/disconnect')
    async disconnectCloud() {
        try {
            await this.cloudStorageService.disconnect();
            return { success: true, message: 'Google Drive disconnected' };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Delete('cloud/:filename')
    async deleteCloudBackup(@Param('filename') filename: string) {
        try {
            await this.cloudStorageService.deleteCloudBackup(filename);
            return { success: true, message: 'Cloud backup deleted' };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ============================================
    // SETTINGS ENDPOINTS
    // ============================================

    @Get('settings')
    async getSettings() {
        return this.cloudStorageService.getSettings();
    }

    @Put('settings')
    async updateSettings(@Body() body: {
        autoBackup?: boolean;
        backupTime?: string;
        retentionDays?: number;
    }) {
        try {
            const result = await this.cloudStorageService.updateSettings(body);
            return { success: true, message: 'Settings updated', data: result };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
