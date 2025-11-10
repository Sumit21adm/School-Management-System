import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

@Controller('attendance')
@UseGuards(AuthGuard('jwt'))
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateAttendanceDto) {
    return this.attendanceService.create(req.user.tenantId, req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: any, @Query() query: QueryAttendanceDto) {
    return this.attendanceService.findAll(req.user.tenantId, query);
  }

  @Get('stats')
  getStats(@Request() req: any) {
    return this.attendanceService.getStats(req.user.tenantId);
  }

  @Get('reports/section/:sectionId')
  getSectionReport(
    @Request() req: any,
    @Param('sectionId') sectionId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.attendanceService.getSectionReport(req.user.tenantId, sectionId, fromDate, toDate);
  }

  @Get('reports/student/:studentId')
  getStudentReport(
    @Request() req: any,
    @Param('studentId') studentId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.attendanceService.getStudentReport(req.user.tenantId, studentId, fromDate, toDate);
  }

  @Get('reports/class/:classId')
  getClassReport(
    @Request() req: any,
    @Param('classId') classId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.attendanceService.getClassReport(req.user.tenantId, classId, fromDate, toDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.attendanceService.findOne(id, req.user.tenantId);
  }
}
