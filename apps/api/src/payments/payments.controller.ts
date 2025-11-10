import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  Query 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Request() req: any, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(req.user.tenantId, createPaymentDto);
  }

  @Post('webhook')
  processWebhook(@Body() webhookPayload: WebhookPayloadDto) {
    // Webhook endpoint doesn't require authentication
    return this.paymentsService.processWebhook(webhookPayload);
  }

  @Post('initiate/:invoiceId')
  @UseGuards(AuthGuard('jwt'))
  initiatePayment(@Param('invoiceId') invoiceId: string, @Request() req: any) {
    return this.paymentsService.initiatePayment(invoiceId, req.user.tenantId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(
    @Request() req: any,
    @Query('invoiceId') invoiceId?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.findAll(req.user.tenantId, { invoiceId, status });
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  getStats(@Request() req: any) {
    return this.paymentsService.getStats(req.user.tenantId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.paymentsService.findOne(id, req.user.tenantId);
  }
}
