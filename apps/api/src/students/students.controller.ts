import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StudentsService } from './students.service';

@Controller('students')
@UseGuards(AuthGuard('jwt'))
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

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
}
