import { Module } from '@nestjs/common';
import { FeeStructureController } from './fee-structure.controller';
import { FeeStructureService } from './fee-structure.service';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [FeeStructureController],
    providers: [FeeStructureService, PrismaService],
    exports: [FeeStructureService],
})
export class FeeStructureModule { }
