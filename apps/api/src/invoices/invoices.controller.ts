import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  UseGuards, 
  Request,
  Query 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { BulkGenerateInvoiceDto } from './dto/bulk-generate-invoice.dto';

@Controller('invoices')
@UseGuards(AuthGuard('jwt'))
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Request() req: any, @Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(req.user.tenantId, createInvoiceDto);
  }

  @Post('bulk-generate')
  bulkGenerate(@Request() req: any, @Body() bulkGenerateDto: BulkGenerateInvoiceDto) {
    return this.invoicesService.bulkGenerate(req.user.tenantId, bulkGenerateDto);
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    return this.invoicesService.findAll(req.user.tenantId, { studentId, status });
  }

  @Get('stats')
  getStats(@Request() req: any) {
    return this.invoicesService.getStats(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.invoicesService.findOne(id, req.user.tenantId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body('status') status: string,
  ) {
    return this.invoicesService.updateStatus(id, req.user.tenantId, status);
  }
}
