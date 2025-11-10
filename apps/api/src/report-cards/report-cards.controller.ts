import { Controller, Get, Param, UseGuards, Request, Res, Response as NestResponse } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { ReportCardsService } from './report-cards.service';

@Controller('report-cards')
@UseGuards(AuthGuard('jwt'))
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}

  @Get('exam/:examId/student/:studentId')
  async generateReportCard(
    @Param('examId') examId: string,
    @Param('studentId') studentId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.reportCardsService.generateReportCard(
      examId,
      studentId,
      req.user.tenantId,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=report-card-${studentId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Get('student/:studentId')
  getStudentReportCards(@Param('studentId') studentId: string, @Request() req: any) {
    return this.reportCardsService.getStudentReportCards(studentId, req.user.tenantId);
  }
}
