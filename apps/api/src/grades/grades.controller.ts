import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GradesService } from './grades.service';
import { CreateGradeScaleDto } from './dto/create-grade-scale.dto';

@Controller('grades')
@UseGuards(AuthGuard('jwt'))
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post('scales')
  createGradeScale(@Request() req: any, @Body() createGradeScaleDto: CreateGradeScaleDto) {
    return this.gradesService.createGradeScale(req.user.tenantId, createGradeScaleDto);
  }

  @Get('scales')
  findAllGradeScales(@Request() req: any) {
    return this.gradesService.findAllGradeScales(req.user.tenantId);
  }

  @Get('scales/:id')
  findOneGradeScale(@Param('id') id: string) {
    return this.gradesService.findOneGradeScale(id);
  }
}
