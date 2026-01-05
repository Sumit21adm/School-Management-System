import { Module } from '@nestjs/common';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { PrismaService } from '../prisma.service';
import { ReceiptPdfService } from './receipt-pdf.service';
import { DemandBillPdfService } from './demand-bill-pdf.service';

@Module({
  providers: [FeesService, PrismaService, ReceiptPdfService, DemandBillPdfService],
  controllers: [FeesController],
  exports: [FeesService, ReceiptPdfService, DemandBillPdfService]
})
export class FeesModule { }
