import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClassesService } from './classes.service';

@Controller('classes')
@UseGuards(AuthGuard('jwt'))
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.classesService.findAll(req.user.tenantId);
  }

  @Get('subjects')
  getSubjects(@Request() req: any) {
    return this.classesService.getSubjects(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.classesService.findOne(id, req.user.tenantId);
  }
}
