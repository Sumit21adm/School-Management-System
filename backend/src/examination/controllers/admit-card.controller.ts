
import { Controller, Get, Post, Param, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AdmitCardService } from '../services/admit-card.service';
import { AdmitCardPdfService } from '../services/admit-card-pdf.service';
import { DummyExaminationDataService } from '../services/dummy-examination-data.service';

@Controller('examination')
export class AdmitCardController {
    constructor(
        private readonly admitCardService: AdmitCardService,
        private readonly admitCardPdfService: AdmitCardPdfService,
        private readonly dummyDataService: DummyExaminationDataService
    ) { }

    @Get('admit-card/:examId/:studentId')
    async getAdmitCard(
        @Param('examId') examId: string,
        @Param('studentId') studentId: string
    ) {
        return this.admitCardService.generateAdmitCard(parseInt(examId), studentId);
    }

    @Post('admit-card/pdf')
    async generatePdf(
        @Body() body: { examId: number; studentIds: string[] },
        @Res() res: Response
    ) {
        const buffer = await this.admitCardPdfService.generateAdmitCardsPdf(body.examId, body.studentIds);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=admit-cards-${Date.now()}.pdf`,
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    @Post('dummy-data/generate')
    async generateDummyData() {
        return this.dummyDataService.generateDummyData();
    }
}
