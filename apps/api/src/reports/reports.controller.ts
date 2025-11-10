import { Controller, Post, Body, UseGuards, Request, Response, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response as ExpressResponse } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  async generateReport(
    @Request() req: any,
    @Body() dto: GenerateReportDto,
    @Response() res: ExpressResponse,
  ) {
    const tenantId = req.user.tenantId;
    
    const result = await this.reportsService.generateReport(tenantId, dto);
    
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }

  @Get('types')
  async getReportTypes() {
    return this.reportsService.getReportTypes();
  }
}
