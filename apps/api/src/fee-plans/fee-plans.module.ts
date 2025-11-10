import { Module } from '@nestjs/common';
import { FeePlansService } from './fee-plans.service';
import { FeePlansController } from './fee-plans.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeePlansController],
  providers: [FeePlansService],
  exports: [FeePlansService],
})
export class FeePlansModule {}
