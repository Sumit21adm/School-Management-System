import { Controller, Get, Post, Body, Query, Param, ParseIntPipe, Res, NotFoundException, Delete } from '@nestjs/common';
import type { Response } from 'express';
import { FeesService } from './fees.service';
import { CollectFeeDto, FeeStatementDto } from './dto/fee-collection.dto';
import { GenerateDemandBillDto } from './dto/demand-bill.dto';
import { ReceiptPdfService } from './receipt-pdf.service';
import { DemandBillPdfService } from './demand-bill-pdf.service';
import { PrismaService } from '../prisma.service';

@Controller('fees')
export class FeesController {
    constructor(
        private readonly feesService: FeesService,
        private readonly receiptPdfService: ReceiptPdfService,
        private readonly demandBillPdfService: DemandBillPdfService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('collect')
    async collectFee(@Body() dto: CollectFeeDto) {
        return this.feesService.collectFee(dto);
    }

    @Post('statement')
    async getStudentStatement(@Body() dto: FeeStatementDto) {
        return this.feesService.getStudentStatement(dto);
    }

    @Post('demand-bills/generate')
    async generateDemandBills(@Body() dto: GenerateDemandBillDto) {
        return this.feesService.generateDemandBills(dto);
    }

    @Get('demand-bills/history/:sessionId')
    async getBillGenerationHistory(@Param('sessionId', ParseIntPipe) sessionId: number) {
        return this.feesService.getBillGenerationHistory(sessionId);
    }

    @Get('dashboard/:studentId/session/:sessionId')
    async getStudentDashboard(
        @Param('studentId') studentId: string,
        @Param('sessionId', ParseIntPipe) sessionId: number
    ) {
        return this.feesService.getStudentDashboard(studentId, sessionId);
    }

    @Get('fee-book/:studentId/session/:sessionId')
    async getYearlyFeeBook(
        @Param('studentId') studentId: string,
        @Param('sessionId', ParseIntPipe) sessionId: number
    ) {
        return this.feesService.getYearlyFeeBook(studentId, sessionId);
    }

    @Get('transactions')
    async getTransactions(@Query() query: any) {
        return this.feesService.getTransactions(query);
    }

    @Get('receipt/pdf')
    async getReceiptPdf(
        @Query('receiptNo') receiptNo: string,
        @Res() res: Response,
    ) {
        try {
            if (!receiptNo) {
                throw new NotFoundException('Receipt number is required');
            }

            // Fetch receipt metadata for better filename
            const transaction = await this.prisma.feeTransaction.findUnique({
                where: { receiptNo },
                select: { studentId: true, date: true },
            });

            const pdfBuffer = await this.receiptPdfService.generateReceiptByReceiptNo(receiptNo);

            // Format date as DDMMYYYY
            const dateStr = transaction?.date
                ? new Date(transaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '')
                : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');

            const studentId = transaction?.studentId || 'UNKNOWN';
            const filename = `Receipt-${studentId}-${dateStr}.pdf`;

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
                'Content-Length': pdfBuffer.length,
            });

            res.send(pdfBuffer);
        } catch (error) {
            console.error('[FeesController] Error generating Receipt PDF:', error);
            throw new NotFoundException('Receipt not found or error generating PDF');
        }
    }

    @Get('demand-bill/pdf')
    async getDemandBillPdf(
        @Query('billNo') billNo: string,
        @Res() res: Response,
    ) {
        try {
            if (!billNo) {
                throw new NotFoundException('Bill number is required');
            }

            // Fetch bill metadata for better filename
            const bill = await this.prisma.demandBill.findUnique({
                where: { billNo },
                select: { studentId: true, billDate: true, month: true, year: true },
            });

            const pdfBuffer = await this.demandBillPdfService.generateDemandBillPdf(billNo);

            // Format: DemandBill-StudentId-MonthYear.pdf
            const monthYear = bill ? `${String(bill.month).padStart(2, '0')}${bill.year}` : '';
            const studentId = bill?.studentId || 'UNKNOWN';
            const filename = `DemandBill-${studentId}-${monthYear}.pdf`;

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
                'Content-Length': pdfBuffer.length,
            });

            res.send(pdfBuffer);
        } catch (error) {
            console.error('[FeesController] Error generating PDF:', error);
            throw new NotFoundException(error.message || 'Demand bill not found');
        }
    }

    @Post('demand-bills/batch-pdf')
    async getBatchDemandBillPdf(
        @Body() body: {
            billNumbers: string[],
            period?: string,
            billType?: string,
            classInfo?: string
        },
        @Res() res: Response,
    ) {
        console.log('Batch PDF Request received for bill numbers:', body.billNumbers.length);
        try {
            const pdfBuffer = await this.demandBillPdfService.generateBatchPdf(body.billNumbers);
            console.log('Batch PDF generated successfully, size:', pdfBuffer.length);

            // Construct meaningful filename
            // Default: DemandBills-Batch-YYYYMMDD.pdf
            let filenameBase = 'DemandBills';

            if (body.period) {
                filenameBase += `-${body.period}`;
            }

            if (body.classInfo) {
                filenameBase += `-${body.classInfo}`;
            }

            if (body.billType) {
                // Simplify bill type string (e.g., "Entire Class" -> "Class")
                const type = body.billType.replace(/\s+/g, '');
                filenameBase += `-${type}`;
            }

            // Sanitize filename
            const cleanFilename = filenameBase.replace(/[^a-zA-Z0-9-_]/g, '-');
            const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');
            const filename = `${cleanFilename}-${dateStr}.pdf`;

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
                'Content-Length': pdfBuffer.length,
            });

            res.send(pdfBuffer);
        } catch (error) {
            console.error('Batch PDF Generation Error:', error);
            throw new NotFoundException(error.message || 'Demand bills not found');
        }
    }
    @Delete('demand-bills/batch')
    async deleteDemandBillBatch(@Body() body: { billNumbers: string[] }) {
        return this.feesService.deleteDemandBillBatch(body.billNumbers);
    }
}
