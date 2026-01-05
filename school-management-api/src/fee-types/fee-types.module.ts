import { Module } from '@nestjs/common';
import { FeeTypesController } from './fee-types.controller';
import { FeeTypesService } from './fee-types.service';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [FeeTypesController],
    providers: [FeeTypesService, PrismaService],
    exports: [FeeTypesService],
})
export class FeeTypesModule { }
