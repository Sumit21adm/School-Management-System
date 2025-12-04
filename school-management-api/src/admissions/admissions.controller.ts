import { Controller, Get, Post, Body, Param, Put, Delete, UseInterceptors, UploadedFile, ConflictException, InternalServerErrorException, Query, Res, Patch } from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdmissionsService } from './admissions.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Prisma } from '@prisma/client';

@Controller('admissions')
export class AdmissionsController {
    constructor(private readonly admissionsService: AdmissionsService) { }

    @Post()
    @UseInterceptors(FileInterceptor('photo', {
        storage: diskStorage({
            destination: './uploads/photos',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async create(@Body() createAdmissionDto: any, @UploadedFile() file: any) {
        if (file) {
            createAdmissionDto.photoUrl = `/uploads/photos/${file.filename}`;
        }

        // Sanitize data
        // Convert empty strings to null for optional fields to avoid unique constraint violations
        const optionalFields = ['email', 'aadharCardNo', 'fatherOccupation', 'motherOccupation', 'whatsAppNo', 'subjects', 'photoUrl'];
        optionalFields.forEach(field => {
            if (createAdmissionDto[field] === '') {
                createAdmissionDto[field] = null;
            }
        });

        // Convert date strings to Date objects
        if (createAdmissionDto.dob) {
            createAdmissionDto.dob = new Date(createAdmissionDto.dob);
        }
        if (createAdmissionDto.admissionDate) {
            createAdmissionDto.admissionDate = new Date(createAdmissionDto.admissionDate);
        }

        // Remove photo field if present (it's handled via UploadedFile)
        delete createAdmissionDto.photo;

        try {
            return await this.admissionsService.create(createAdmissionDto);
        } catch (error) {
            console.error('Error creating admission:', error);
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                throw new ConflictException(`Duplicate entry for ${target}. This value already exists.`);
            }
            throw new InternalServerErrorException(`Failed to create admission: ${error.message}`);
        }
    }

    @Get('template')
    async downloadTemplate(@Res() res: Response) {
        const buffer = await this.admissionsService.generateTemplate();
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=student_import_template.xlsx',
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }

    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    async importStudents(@UploadedFile() file: Express.Multer.File) {
        return this.admissionsService.importStudents(file);
    }

    @Get('export')
    async export(
        @Query('class') className: string,
        @Query('section') section: string,
        @Query('format') format: 'excel' | 'pdf',
        @Res() res: Response,
    ) {
        const buffer = await this.admissionsService.exportStudents({ class: className, section, format });

        if (format === 'excel') {
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="students.xlsx"',
                'Content-Length': (buffer as Buffer).length,
            });
        } else {
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="students.pdf"',
                'Content-Length': (buffer as Buffer).length,
            });
        }

        res.end(buffer);
    }

    @Get('sections/:className')
    getAvailableSections(@Param('className') className: string) {
        return this.admissionsService.getAvailableSections(className);
    }

    @Get()
    findAll(
        @Query('search') search?: string,
        @Query('class') className?: string,
        @Query('section') section?: string,
        @Query('status') status?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.admissionsService.findAll({ search, className, section, status, page, limit });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.admissionsService.findOne(+id);
    }

    @Put(':id')
    @UseInterceptors(FileInterceptor('photo', {
        storage: diskStorage({
            destination: './uploads/photos',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async update(@Param('id') id: string, @Body() updateAdmissionDto: any, @UploadedFile() file: any) {
        if (file) {
            updateAdmissionDto.photoUrl = `/uploads/photos/${file.filename}`;
        }

        // Sanitize data
        const optionalFields = ['email', 'aadharCardNo', 'fatherOccupation', 'motherOccupation', 'whatsAppNo', 'subjects', 'photoUrl'];
        optionalFields.forEach(field => {
            if (updateAdmissionDto[field] === '') {
                updateAdmissionDto[field] = null;
            }
        });

        // Convert date strings to Date objects
        if (updateAdmissionDto.dob) {
            updateAdmissionDto.dob = new Date(updateAdmissionDto.dob);
        }
        if (updateAdmissionDto.admissionDate) {
            updateAdmissionDto.admissionDate = new Date(updateAdmissionDto.admissionDate);
        }

        // Remove photo field if present
        delete updateAdmissionDto.photo;

        try {
            return await this.admissionsService.update(+id, updateAdmissionDto);
        } catch (error) {
            console.error('Error updating admission:', error);
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                throw new ConflictException(`Duplicate entry for ${target}. This value already exists.`);
            }
            throw new InternalServerErrorException(`Failed to update admission: ${error.message}`);
        }
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.admissionsService.remove(+id);
    }
}
