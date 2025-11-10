import { Module } from '@nestjs/common';
import { FeeHeadsService } from './fee-heads.service';
import { FeeHeadsController } from './fee-heads.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeeHeadsController],
  providers: [FeeHeadsService],
  exports: [FeeHeadsService],
})
export class FeeHeadsModule {}
