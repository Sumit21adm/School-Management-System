import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateExamPaperDto } from './dto/create-exam-paper.dto';
import { CreateMarkDto, BulkCreateMarksDto } from './dto/create-mark.dto';

@Controller('exams')
@UseGuards(AuthGuard('jwt'))
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  // ============ Exam Endpoints ============

  @Post()
  createExam(@Request() req: any, @Body() createExamDto: CreateExamDto) {
    return this.examsService.createExam(req.user.tenantId, createExamDto);
  }

  @Get()
  findAllExams(@Request() req: any, @Query('academicYearId') academicYearId?: string) {
    return this.examsService.findAllExams(req.user.tenantId, academicYearId);
  }

  @Get(':id')
  findOneExam(@Param('id') id: string, @Request() req: any) {
    return this.examsService.findOneExam(id, req.user.tenantId);
  }

  @Put(':id')
  updateExam(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateExamDto: UpdateExamDto,
  ) {
    return this.examsService.updateExam(id, req.user.tenantId, updateExamDto);
  }

  @Delete(':id')
  deleteExam(@Param('id') id: string, @Request() req: any) {
    return this.examsService.deleteExam(id, req.user.tenantId);
  }

  // ============ Exam Paper Endpoints ============

  @Post('papers')
  createExamPaper(@Request() req: any, @Body() createExamPaperDto: CreateExamPaperDto) {
    return this.examsService.createExamPaper(req.user.tenantId, createExamPaperDto);
  }

  @Get(':examId/papers')
  findExamPapers(@Param('examId') examId: string, @Request() req: any) {
    return this.examsService.findExamPapers(examId, req.user.tenantId);
  }

  @Delete('papers/:id')
  deleteExamPaper(@Param('id') id: string, @Request() req: any) {
    return this.examsService.deleteExamPaper(id, req.user.tenantId);
  }

  // ============ Marks Endpoints ============

  @Post('marks')
  createMark(@Request() req: any, @Body() createMarkDto: CreateMarkDto) {
    return this.examsService.createMark(req.user.tenantId, createMarkDto);
  }

  @Post('marks/bulk')
  bulkCreateMarks(@Request() req: any, @Body() bulkCreateMarksDto: BulkCreateMarksDto) {
    return this.examsService.bulkCreateMarks(req.user.tenantId, bulkCreateMarksDto);
  }

  @Get('papers/:examPaperId/marks')
  findMarksByPaper(@Param('examPaperId') examPaperId: string, @Request() req: any) {
    return this.examsService.findMarksByPaper(examPaperId, req.user.tenantId);
  }

  @Get('students/:studentId/marks')
  findMarksByStudent(
    @Param('studentId') studentId: string,
    @Request() req: any,
    @Query('examId') examId?: string,
  ) {
    return this.examsService.findMarksByStudent(studentId, req.user.tenantId, examId);
  }
}
