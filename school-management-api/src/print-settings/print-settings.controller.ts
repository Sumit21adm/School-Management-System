import {
    Controller,
    Get,
    Put,
    Post,
    Body,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PrintSettingsService } from './print-settings.service';
import { UpdatePrintSettingsDto } from './dto/print-settings.dto';

@Controller('print-settings')
export class PrintSettingsController {
    constructor(private readonly printSettingsService: PrintSettingsService) { }

    @Get()
    async get() {
        return this.printSettingsService.get();
    }

    @Put()
    async update(@Body() updateDto: UpdatePrintSettingsDto) {
        return this.printSettingsService.update(updateDto);
    }

    @Post('logo')
    @UseInterceptors(
        FileInterceptor('logo', {
            storage: diskStorage({
                destination: './uploads/logos',
                filename: (req, file, cb) => {
                    // Generate unique filename
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    cb(null, `school-logo-${uniqueSuffix}${ext}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                // Only allow images
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                    cb(new BadRequestException('Only image files are allowed'), false);
                } else {
                    cb(null, true);
                }
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB max
            },
        }),
    )
    async uploadLogo(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const logoUrl = `/uploads/logos/${file.filename}`;
        await this.printSettingsService.updateLogoUrl(logoUrl);

        return {
            message: 'Logo uploaded successfully',
            logoUrl,
        };
    }
}
