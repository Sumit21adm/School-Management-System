import { Module } from '@nestjs/common';
import { PrintSettingsController } from './print-settings.controller';
import { PrintSettingsService } from './print-settings.service';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [PrintSettingsController],
    providers: [PrintSettingsService, PrismaService],
    exports: [PrintSettingsService],
})
export class PrintSettingsModule { }
