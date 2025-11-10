import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createPaymentDto: CreatePaymentDto) {
    // Verify invoice exists
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: createPaymentDto.invoiceId, tenantId },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const paymentAmount = new Decimal(createPaymentDto.amount);

    // Calculate total paid amount including this payment
    const totalPaid = invoice.payments
      .filter((p: any) => p.status === 'success')
      .reduce((sum: Decimal, p: any) => sum.add(p.amount), paymentAmount);

    // Validate payment amount
    if (totalPaid.greaterThan(invoice.total)) {
      throw new BadRequestException('Payment amount exceeds invoice total');
    }

    // Create payment
    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        invoiceId: createPaymentDto.invoiceId,
        amount: paymentAmount,
        method: createPaymentDto.method,
        txnRef: createPaymentDto.txnRef,
        status: 'success', // For direct payments, mark as success immediately
      },
      include: {
        invoice: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            items: {
              include: {
                feeHead: true,
              },
            },
          },
        },
      },
    });

    // Update invoice status
    let invoiceStatus = 'pending';
    if (totalPaid.equals(invoice.total)) {
      invoiceStatus = 'paid';
    } else if (totalPaid.greaterThan(new Decimal(0))) {
      invoiceStatus = 'partial';
    }

    await this.prisma.invoice.update({
      where: { id: createPaymentDto.invoiceId },
      data: {
        status: invoiceStatus,
        ...(invoiceStatus === 'paid' && { paidAt: new Date() }),
      },
    });

    return payment;
  }

  async findAll(tenantId: string, filters?: { invoiceId?: string; status?: string }) {
    return this.prisma.payment.findMany({
      where: {
        tenantId,
        ...(filters?.invoiceId && { invoiceId: filters.invoiceId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        invoice: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, tenantId },
      include: {
        invoice: {
          include: {
            student: {
              include: {
                user: true,
                section: {
                  include: {
                    class: true,
                  },
                },
              },
            },
            items: {
              include: {
                feeHead: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async processWebhook(webhookPayload: WebhookPayloadDto) {
    // Find payment by transaction reference
    const payment = await this.prisma.payment.findFirst({
      where: { txnRef: webhookPayload.txnRef },
      include: {
        invoice: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: webhookPayload.status,
      },
    });

    // Update invoice status if payment was successful
    if (webhookPayload.status === 'success') {
      const invoice = payment.invoice;
      const totalPaid = invoice.payments
        .filter((p: any) => p.status === 'success')
        .reduce((sum: Decimal, p: any) => sum.add(p.amount), new Decimal(0));

      let invoiceStatus = 'pending';
      if (totalPaid.greaterThanOrEqualTo(invoice.total)) {
        invoiceStatus = 'paid';
      } else if (totalPaid.greaterThan(new Decimal(0))) {
        invoiceStatus = 'partial';
      }

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: invoiceStatus,
          ...(invoiceStatus === 'paid' && { paidAt: new Date() }),
        },
      });
    }

    return {
      success: true,
      message: 'Webhook processed successfully',
    };
  }

  async initiatePayment(invoiceId: string, tenantId: string) {
    // Verify invoice exists
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        items: {
          include: {
            feeHead: true,
          },
        },
        payments: {
          where: { status: 'success' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Calculate remaining amount
    const totalPaid = invoice.payments.reduce(
      (sum: Decimal, p: any) => sum.add(p.amount),
      new Decimal(0)
    );
    const remainingAmount = invoice.total.minus(totalPaid);

    if (remainingAmount.lessThanOrEqualTo(new Decimal(0))) {
      throw new BadRequestException('Invoice is already paid');
    }

    // Generate transaction reference (stub)
    const txnRef = `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create a pending payment
    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        invoiceId,
        amount: remainingAmount,
        method: 'online',
        txnRef,
        status: 'pending',
      },
    });

    // In a real implementation, this would integrate with Razorpay/Stripe
    // For now, return a stub checkout URL
    return {
      paymentId: payment.id,
      txnRef,
      amount: remainingAmount.toString(),
      checkoutUrl: `https://payment-gateway.example.com/checkout/${txnRef}`,
      invoice: {
        id: invoice.id,
        total: invoice.total.toString(),
        student: {
          name: `${invoice.student.user.firstName} ${invoice.student.user.lastName}`,
          email: invoice.student.user.email,
        },
        items: invoice.items.map((item: any) => ({
          feeHead: item.feeHead.name,
          amount: item.amount.toString(),
        })),
      },
    };
  }

  async getStats(tenantId: string) {
    const total = await this.prisma.payment.count({
      where: { tenantId },
    });

    const success = await this.prisma.payment.count({
      where: { tenantId, status: 'success' },
    });

    const pending = await this.prisma.payment.count({
      where: { tenantId, status: 'pending' },
    });

    const failed = await this.prisma.payment.count({
      where: { tenantId, status: 'failed' },
    });

    const totalAmount = await this.prisma.payment.aggregate({
      where: { tenantId, status: 'success' },
      _sum: { amount: true },
    });

    return {
      total,
      success,
      pending,
      failed,
      totalAmount: totalAmount._sum.amount || new Decimal(0),
    };
  }
}
