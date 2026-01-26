import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ExamTypesController } from './controllers/exam-types.controller';
import { SubjectsController } from './controllers/subjects.controller';
import { ExamsController } from './controllers/exams.controller';
import { AdmitCardController } from './controllers/admit-card.controller';
import { ExamTypesService } from './services/exam-types.service';
import { SubjectsService } from './services/subjects.service';
import { ExamsService } from './services/exams.service';
import { AdmitCardService } from './services/admit-card.service';
import { AdmitCardPdfService } from './services/admit-card-pdf.service'; // Added
import { DummyExaminationDataService } from './services/dummy-examination-data.service';

@Module({
    controllers: [
        ExamTypesController,
        SubjectsController,
        ExamsController,
        AdmitCardController
    ],
    providers: [
        PrismaService,
        ExamTypesService,
        SubjectsService,
        ExamsService,
        AdmitCardService,
        AdmitCardPdfService, // Added
        DummyExaminationDataService
    ]
})
export class ExaminationModule { }
