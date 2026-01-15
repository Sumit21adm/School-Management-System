import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [StaffController],
    providers: [StaffService, PrismaService],
    exports: [StaffService], // Export if other modules need to find staff
})
export class StaffModule { }
