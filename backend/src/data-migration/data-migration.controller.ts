import {
    Controller,
    Get,
    Post,
    Res,
    UseInterceptors,
    UploadedFile,
    Body,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { DataMigrationService } from './data-migration.service';
import { ImportOptionsDto, ValidationResultDto, ImportResultDto } from './dto/data-migration.dto';

@Controller('data-migration')
export class DataMigrationController {
    constructor(private readonly dataMigrationService: DataMigrationService) { }

    // ============================================
    // TEMPLATE DOWNLOADS
    // ============================================

    /**
     * Download complete multi-sheet Excel template
     */
    @Get('templates/complete')
    async downloadCompleteTemplate(@Res() res: Response) {
        try {
            const buffer = await this.dataMigrationService.generateCompleteTemplate();

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=data_migration_template.xlsx'
            );
            res.send(buffer);
        } catch (error: any) {
            throw new HttpException(
                error.message || 'Failed to generate template',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // ============================================
    // VALIDATION ENDPOINTS
    // ============================================

    /**
     * Validate students import file (dry-run)
     */
    @Post('validate/students')
    @UseInterceptors(FileInterceptor('file'))
    async validateStudents(
        @UploadedFile() file: Express.Multer.File
    ): Promise<ValidationResultDto> {
        if (!file) {
            throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
        }
        return this.dataMigrationService.validateStudentsImport(file);
    }

    // ============================================
    // IMPORT ENDPOINTS
    // ============================================

    /**
     * Import students from Excel file
     */
    @Post('import/students')
    @UseInterceptors(FileInterceptor('file'))
    async importStudents(
        @UploadedFile() file: Express.Multer.File,
        @Body() options: ImportOptionsDto
    ): Promise<ImportResultDto> {
        if (!file) {
            throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
        }
        return this.dataMigrationService.importStudents(file, {
            skipOnError: options?.skipOnError === true || options?.skipOnError === 'true' as any,
        });
    }

    /**
     * Import fee receipts from Excel file
     */
    @Post('import/fee-receipts')
    @UseInterceptors(FileInterceptor('file'))
    async importFeeReceipts(
        @UploadedFile() file: Express.Multer.File,
        @Body() options: ImportOptionsDto
    ): Promise<ImportResultDto> {
        if (!file) {
            throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
        }
        return this.dataMigrationService.importFeeReceipts(file, {
            skipOnError: options?.skipOnError === true || options?.skipOnError === 'true' as any,
        });
    }

    /**
     * Import demand bills from Excel file
     */
    @Post('import/demand-bills')
    @UseInterceptors(FileInterceptor('file'))
    async importDemandBills(
        @UploadedFile() file: Express.Multer.File,
        @Body() options: ImportOptionsDto
    ): Promise<ImportResultDto> {
        if (!file) {
            throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
        }
        return this.dataMigrationService.importDemandBills(file, {
            skipOnError: options?.skipOnError === true || options?.skipOnError === 'true' as any,
        });
    }

    /**
     * Import discounts from Excel file
     */
    @Post('import/discounts')
    @UseInterceptors(FileInterceptor('file'))
    async importDiscounts(
        @UploadedFile() file: Express.Multer.File,
        @Body() options: ImportOptionsDto
    ): Promise<ImportResultDto> {
        if (!file) {
            throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
        }
        return this.dataMigrationService.importDiscounts(file, {
            skipOnError: options?.skipOnError === true || options?.skipOnError === 'true' as any,
        });
    }
}
