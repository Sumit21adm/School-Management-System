import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeeHeadsService } from './fee-heads.service';
import { CreateFeeHeadDto } from './dto/create-fee-head.dto';
import { UpdateFeeHeadDto } from './dto/update-fee-head.dto';

@Controller('fee-heads')
@UseGuards(AuthGuard('jwt'))
export class FeeHeadsController {
  constructor(private readonly feeHeadsService: FeeHeadsService) {}

  @Post()
  create(@Request() req: any, @Body() createFeeHeadDto: CreateFeeHeadDto) {
    return this.feeHeadsService.create(req.user.tenantId, createFeeHeadDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.feeHeadsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.feeHeadsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateFeeHeadDto: UpdateFeeHeadDto,
  ) {
    return this.feeHeadsService.update(id, req.user.tenantId, updateFeeHeadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.feeHeadsService.remove(id, req.user.tenantId);
  }
}
