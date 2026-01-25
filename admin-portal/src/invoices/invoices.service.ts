import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvoicesService {
    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) { }

    async generateInvoice(subscriptionId: number) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                organization: true,
                plan: true,
                addons: { include: { addon: true } },
            },
        });

        if (!subscription) {
            throw new NotFoundException('Subscription not found');
        }

        const plan = subscription.plan;
        const gstRate = this.config.get<number>('GST_RATE', 18) / 100;

        // Calculate fees
        const studentCount = subscription.studentCount || 0;
        const baseFee = Number(plan.baseFeeMonthly);
        const studentFee = studentCount * Number(plan.pricePerStudent);

        // Calculate addons fee
        const addonsFee = subscription.addons.reduce((sum, sa) => {
            return sum + Number(sa.addon.priceMonthly);
        }, 0);

        const subtotal = baseFee + studentFee + addonsFee;
        const tax = subtotal * gstRate;
        const total = subtotal + tax;

        // Generate invoice number
        const year = new Date().getFullYear();
        const count = await this.prisma.invoice.count({
            where: {
                invoiceNo: { startsWith: `INV-${year}` },
            },
        });
        const invoiceNo = `INV-${year}-${String(count + 1).padStart(5, '0')}`;

        // Calculate period
        const periodStart = new Date();
        const periodEnd = new Date();
        if (subscription.billingCycle === 'YEARLY') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

        return this.prisma.invoice.create({
            data: {
                invoiceNo,
                organizationId: subscription.organizationId,
                subscriptionId,
                periodStart,
                periodEnd,
                studentCount,
                baseFee,
                studentFee,
                addonsFee,
                subtotal,
                tax,
                total,
                status: 'PENDING',
                dueDate,
            },
            include: {
                organization: true,
                subscription: { include: { plan: true } },
            },
        });
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        status?: string;
        organizationId?: number;
    }) {
        const { skip = 0, take = 20, status, organizationId } = params;

        const where: any = {};
        if (status) where.status = status;
        if (organizationId) where.organizationId = organizationId;

        const [invoices, total] = await Promise.all([
            this.prisma.invoice.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    organization: { select: { id: true, name: true, slug: true } },
                },
            }),
            this.prisma.invoice.count({ where }),
        ]);

        return {
            data: invoices,
            total,
            page: Math.floor(skip / take) + 1,
            totalPages: Math.ceil(total / take),
        };
    }

    async findOne(id: number) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: {
                organization: true,
                subscription: {
                    include: {
                        plan: true,
                        addons: { include: { addon: true } },
                    },
                },
            },
        });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        return invoice;
    }

    async markAsPaid(id: number, paymentDetails: {
        gateway: string;
        paymentId: string;
        paymentOrderId?: string;
        paymentMethod?: string;
    }) {
        await this.findOne(id);

        return this.prisma.invoice.update({
            where: { id },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                paymentGateway: paymentDetails.gateway,
                paymentId: paymentDetails.paymentId,
                paymentOrderId: paymentDetails.paymentOrderId,
                paymentMethod: paymentDetails.paymentMethod,
            },
        });
    }

    async getOverdueInvoices() {
        return this.prisma.invoice.findMany({
            where: {
                status: 'PENDING',
                dueDate: { lt: new Date() },
            },
            include: {
                organization: true,
            },
        });
    }

    async getRevenueStats() {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [thisMonthRevenue, lastMonthRevenue, totalRevenue, pendingAmount] = await Promise.all([
            this.prisma.invoice.aggregate({
                where: {
                    status: 'PAID',
                    paidAt: { gte: thisMonth },
                },
                _sum: { total: true },
            }),
            this.prisma.invoice.aggregate({
                where: {
                    status: 'PAID',
                    paidAt: { gte: lastMonth, lt: thisMonth },
                },
                _sum: { total: true },
            }),
            this.prisma.invoice.aggregate({
                where: { status: 'PAID' },
                _sum: { total: true },
            }),
            this.prisma.invoice.aggregate({
                where: { status: 'PENDING' },
                _sum: { total: true },
            }),
        ]);

        return {
            thisMonth: thisMonthRevenue._sum.total || 0,
            lastMonth: lastMonthRevenue._sum.total || 0,
            total: totalRevenue._sum.total || 0,
            pending: pendingAmount._sum.total || 0,
        };
    }
}
