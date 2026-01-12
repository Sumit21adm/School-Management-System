import { Controller, Get, Post, Delete, Body, Param, Res, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import type { Response } from 'express';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { UserRole } from '@prisma/client';

@Controller('backup')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class BackupController {
    constructor(private readonly backupService: BackupService) { }

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
        return this.backupService.listBackups();
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
}
