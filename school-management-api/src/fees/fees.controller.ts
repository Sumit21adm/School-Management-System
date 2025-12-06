import { Controller, Get, Post, Body, Query, Param, ParseIntPipe } from '@nestjs/common';
import { FeesService } from './fees.service';
import { CollectFeeDto, FeeStatementDto } from './dto/fee-collection.dto';
import { GenerateDemandBillDto } from './dto/demand-bill.dto';

@Controller('fees')
export class FeesController {
    constructor(private readonly feesService: FeesService) { }

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
}
