import {
    Controller,
    Post,
    Body,
    Param,
    Headers,
    RawBodyRequest,
    Req,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly service: PaymentsService) { }

    // ============================================
    // RAZORPAY
    // ============================================

    @Post('razorpay/create-order/:invoiceId')
    @UseGuards(JwtAuthGuard)
    createRazorpayOrder(@Param('invoiceId', ParseIntPipe) invoiceId: number) {
        return this.service.createRazorpayOrder(invoiceId);
    }

    @Post('razorpay/verify')
    @UseGuards(JwtAuthGuard)
    verifyRazorpayPayment(
        @Body() payload: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
        },
    ) {
        return this.service.verifyRazorpayPayment(payload);
    }

    // ============================================
    // STRIPE
    // ============================================

    @Post('stripe/create-checkout/:invoiceId')
    @UseGuards(JwtAuthGuard)
    createStripeCheckout(@Param('invoiceId', ParseIntPipe) invoiceId: number) {
        return this.service.createStripeCheckoutSession(invoiceId);
    }

    @Post('stripe/webhook')
    async handleStripeWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
    ) {
        return this.service.handleStripeWebhook(req.rawBody!, signature);
    }
}
