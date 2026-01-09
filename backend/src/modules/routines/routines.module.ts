import { Module } from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { RoutinesController } from './routines.controller';
import { PrismaService } from '../../prisma.service';

@Module({
    controllers: [RoutinesController],
    providers: [RoutinesService, PrismaService],
})
export class RoutinesModule { }
