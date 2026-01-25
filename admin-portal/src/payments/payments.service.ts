import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Razorpay from 'razorpay';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
    private razorpay: Razorpay;
    private stripe: Stripe;

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) {
        // Initialize Razorpay
        this.razorpay = new Razorpay({
            key_id: this.config.get<string>('RAZORPAY_KEY_ID') || '',
            key_secret: this.config.get<string>('RAZORPAY_KEY_SECRET') || '',
        });

        // Initialize Stripe
        const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY') || '';
        this.stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16' as any,
        });
    }


    // ============================================
    // RAZORPAY METHODS
    // ============================================

    async createRazorpayOrder(invoiceId: number) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { organization: true },
        });

        if (!invoice) {
            throw new BadRequestException('Invoice not found');
        }

        if (invoice.status === 'PAID') {
            throw new BadRequestException('Invoice already paid');
        }

        const order = await this.razorpay.orders.create({
            amount: Math.round(Number(invoice.total) * 100), // Convert to paise
            currency: 'INR',
            receipt: invoice.invoiceNo,
            notes: {
                invoiceId: invoice.id.toString(),
                organizationId: invoice.organizationId.toString(),
            },
        });

        // Log transaction
        await this.prisma.paymentTransaction.create({
            data: {
                invoiceId: invoice.id,
                gateway: 'razorpay',
                gatewayOrderId: order.id,
                amount: invoice.total,
                currency: 'INR',
                status: 'created',
            },
        });

        return {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: this.config.get<string>('RAZORPAY_KEY_ID'),
            organization: {
                name: invoice.organization.name,
                email: invoice.organization.email,
            },
        };
    }

    async verifyRazorpayPayment(payload: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }) {
        const crypto = require('crypto');
        const secret = this.config.get<string>('RAZORPAY_KEY_SECRET');

        const body = `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== payload.razorpay_signature) {
            throw new BadRequestException('Invalid payment signature');
        }

        // Find the transaction
        const transaction = await this.prisma.paymentTransaction.findFirst({
            where: { gatewayOrderId: payload.razorpay_order_id },
        });

        if (!transaction || !transaction.invoiceId) {
            throw new BadRequestException('Transaction not found');
        }

        // Update transaction
        await this.prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: {
                gatewayPaymentId: payload.razorpay_payment_id,
                status: 'paid',
            },
        });

        // Update invoice
        const invoice = await this.prisma.invoice.update({
            where: { id: transaction.invoiceId },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                paymentGateway: 'razorpay',
                paymentId: payload.razorpay_payment_id,
                paymentOrderId: payload.razorpay_order_id,
            },
        });

        // Activate subscription if trial
        if (invoice.subscriptionId) {
            await this.prisma.subscription.update({
                where: { id: invoice.subscriptionId },
                data: { status: 'ACTIVE' },
            });
        }

        return { success: true, invoiceId: invoice.id };
    }

    // ============================================
    // STRIPE METHODS
    // ============================================

    async createStripeCheckoutSession(invoiceId: number) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                organization: true,
                subscription: { include: { plan: true } },
            },
        });

        if (!invoice) {
            throw new BadRequestException('Invoice not found');
        }

        if (invoice.status === 'PAID') {
            throw new BadRequestException('Invoice already paid');
        }

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: `Subscription - ${invoice.subscription?.plan?.name || 'Plan'}`,
                            description: `Invoice ${invoice.invoiceNo}`,
                        },
                        unit_amount: Math.round(Number(invoice.total) * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${this.config.get('FRONTEND_URL')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${this.config.get('FRONTEND_URL')}/payment/cancel`,
            metadata: {
                invoiceId: invoice.id.toString(),
                organizationId: invoice.organizationId.toString(),
            },
        });

        // Log transaction
        await this.prisma.paymentTransaction.create({
            data: {
                invoiceId: invoice.id,
                gateway: 'stripe',
                gatewayOrderId: session.id,
                amount: invoice.total,
                currency: 'INR',
                status: 'created',
            },
        });

        return { sessionId: session.id, url: session.url };
    }

    async handleStripeWebhook(payload: Buffer, signature: string) {
        const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') || '';

        let event: Stripe.Event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        } catch (err) {
            throw new BadRequestException('Invalid webhook signature');
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const invoiceId = parseInt(session.metadata?.invoiceId || '0');

            if (invoiceId) {
                // Update invoice
                const invoice = await this.prisma.invoice.update({
                    where: { id: invoiceId },
                    data: {
                        status: 'PAID',
                        paidAt: new Date(),
                        paymentGateway: 'stripe',
                        paymentId: session.payment_intent as string,
                        paymentOrderId: session.id,
                    },
                });

                // Update transaction
                await this.prisma.paymentTransaction.updateMany({
                    where: { gatewayOrderId: session.id },
                    data: {
                        gatewayPaymentId: session.payment_intent as string,
                        status: 'paid',
                    },
                });

                // Activate subscription if trial
                if (invoice.subscriptionId) {
                    await this.prisma.subscription.update({
                        where: { id: invoice.subscriptionId },
                        data: { status: 'ACTIVE' },
                    });
                }
            }
        }

        return { received: true };
    }
}
