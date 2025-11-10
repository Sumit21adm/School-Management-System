import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, ValidationPipe, Res, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { StudentsService } from './students.service';
import { StudentIdService } from './student-id.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ImportStudentsDto } from './dto/import-students.dto';
import { LinkGuardianDto } from './dto/link-guardian.dto';

@Controller('students')
@UseGuards(AuthGuard('jwt'))
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly studentIdService: StudentIdService,
  ) {}

  @Get()
  findAll(@Request() req: any, @Query('sectionId') sectionId?: string, @Query('status') status?: string) {
    return this.studentsService.findAll(req.user.tenantId, { sectionId, status });
  }

  @Get('stats')
  getStats(@Request() req: any) {
    return this.studentsService.getStats(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.studentsService.findOne(id, req.user.tenantId);
  }

  @Post()
  create(@Request() req: any, @Body(ValidationPipe) createStudentDto: CreateStudentDto) {
    return this.studentsService.create(req.user.tenantId, createStudentDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body(ValidationPipe) updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, req.user.tenantId, updateStudentDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.studentsService.delete(id, req.user.tenantId);
  }

  @Post('import')
  importStudents(@Request() req: any, @Body(ValidationPipe) importDto: ImportStudentsDto) {
    return this.studentsService.importStudents(req.user.tenantId, importDto);
  }

  @Post(':id/guardians')
  linkGuardian(
    @Param('id') id: string,
    @Request() req: any,
    @Body(ValidationPipe) linkGuardianDto: LinkGuardianDto,
  ) {
    return this.studentsService.linkGuardian(id, req.user.tenantId, linkGuardianDto);
  }

  @Delete(':id/guardians/:guardianId')
  unlinkGuardian(
    @Param('id') id: string,
    @Param('guardianId') guardianId: string,
    @Request() req: any,
  ) {
    return this.studentsService.unlinkGuardian(id, guardianId, req.user.tenantId);
  }

  @Get(':id/id-card')
  async generateIdCard(
    @Param('id') id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const student = await this.studentsService.findOne(id, req.user.tenantId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const pdfBuffer = await this.studentIdService.generateStudentIdCard(student);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="student-id-${student.admissionNo}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}
