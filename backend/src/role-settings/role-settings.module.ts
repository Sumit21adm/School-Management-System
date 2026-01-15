import { Module } from '@nestjs/common';
import { RoleSettingsController } from './role-settings.controller';
import { RoleSettingsService } from './role-settings.service';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [RoleSettingsController],
    providers: [RoleSettingsService, PrismaService],
    exports: [RoleSettingsService],
})
export class RoleSettingsModule { }
