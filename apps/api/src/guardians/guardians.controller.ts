import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GuardiansService } from './guardians.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

@Controller('guardians')
@UseGuards(AuthGuard('jwt'))
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.guardiansService.findAll(req.user.tenantId);
  }

  @Get('stats')
  getStats(@Request() req: any) {
    return this.guardiansService.getStats(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.guardiansService.findOne(id, req.user.tenantId);
  }

  @Post()
  create(@Request() req: any, @Body(ValidationPipe) createGuardianDto: CreateGuardianDto) {
    return this.guardiansService.create(req.user.tenantId, createGuardianDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body(ValidationPipe) updateGuardianDto: UpdateGuardianDto,
  ) {
    return this.guardiansService.update(id, req.user.tenantId, updateGuardianDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.guardiansService.delete(id, req.user.tenantId);
  }
}
