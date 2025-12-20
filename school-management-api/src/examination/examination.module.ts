import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ExamTypesController } from './controllers/exam-types.controller';
import { SubjectsController } from './controllers/subjects.controller';
import { ExamsController } from './controllers/exams.controller';
import { ExamTypesService } from './services/exam-types.service';
import { SubjectsService } from './services/subjects.service';
import { ExamsService } from './services/exams.service';

@Module({
    controllers: [
        ExamTypesController,
        SubjectsController,
        ExamsController
    ],
    providers: [
        PrismaService,
        ExamTypesService,
        SubjectsService,
        ExamsService
    ]
})
export class ExaminationModule { }
