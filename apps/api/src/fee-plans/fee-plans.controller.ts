import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request,
  Query 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeePlansService } from './fee-plans.service';
import { CreateFeePlanDto } from './dto/create-fee-plan.dto';
import { UpdateFeePlanDto } from './dto/update-fee-plan.dto';

@Controller('fee-plans')
@UseGuards(AuthGuard('jwt'))
export class FeePlansController {
  constructor(private readonly feePlansService: FeePlansService) {}

  @Post()
  create(@Request() req: any, @Body() createFeePlanDto: CreateFeePlanDto) {
    return this.feePlansService.create(req.user.tenantId, createFeePlanDto);
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('classId') classId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.feePlansService.findAll(req.user.tenantId, { classId, academicYearId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.feePlansService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateFeePlanDto: UpdateFeePlanDto,
  ) {
    return this.feePlansService.update(id, req.user.tenantId, updateFeePlanDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.feePlansService.remove(id, req.user.tenantId);
  }
}
