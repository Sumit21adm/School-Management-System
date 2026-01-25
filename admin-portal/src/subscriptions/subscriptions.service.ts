import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) { }

    async create(dto: CreateSubscriptionDto) {
        // Check if org already has subscription
        const existing = await this.prisma.subscription.findUnique({
            where: { organizationId: dto.organizationId },
        });

        if (existing) {
            throw new BadRequestException('Organization already has a subscription');
        }

        // Get plan
        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { id: dto.planId },
        });

        if (!plan) {
            throw new NotFoundException('Plan not found');
        }

        // Calculate dates
        const startDate = new Date();
        const trialDays = this.config.get<number>('TRIAL_PERIOD_DAYS', 30);
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

        return this.prisma.subscription.create({
            data: {
                organizationId: dto.organizationId,
                planId: dto.planId,
                status: 'TRIAL',
                billingCycle: dto.billingCycle || 'MONTHLY',
                startDate,
                trialEndsAt,
                nextBillingDate: trialEndsAt,
            },
            include: {
                plan: true,
                organization: true,
            },
        });
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        status?: string;
    }) {
        const { skip = 0, take = 20, status } = params;

        const where: any = {};
        if (status) {
            where.status = status;
        }

        const [subscriptions, total] = await Promise.all([
            this.prisma.subscription.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    plan: true,
                    organization: {
                        select: { id: true, name: true, slug: true, email: true },
                    },
                },
            }),
            this.prisma.subscription.count({ where }),
        ]);

        return {
            data: subscriptions,
            total,
            page: Math.floor(skip / take) + 1,
            totalPages: Math.ceil(total / take),
        };
    }

    async findOne(id: number) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id },
            include: {
                plan: true,
                organization: true,
                addons: { include: { addon: true } },
                invoices: { take: 10, orderBy: { createdAt: 'desc' } },
            },
        });

        if (!subscription) {
            throw new NotFoundException('Subscription not found');
        }

        return subscription;
    }

    async changePlan(id: number, newPlanId: number) {
        const subscription = await this.findOne(id);

        const newPlan = await this.prisma.subscriptionPlan.findUnique({
            where: { id: newPlanId },
        });

        if (!newPlan) {
            throw new NotFoundException('New plan not found');
        }

        return this.prisma.subscription.update({
            where: { id },
            data: { planId: newPlanId },
            include: { plan: true },
        });
    }

    async cancel(id: number, reason?: string) {
        await this.findOne(id);

        return this.prisma.subscription.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelReason: reason,
                autoRenew: false,
            },
        });
    }

    async activate(id: number) {
        await this.findOne(id);

        return this.prisma.subscription.update({
            where: { id },
            data: { status: 'ACTIVE' },
        });
    }

    async updateStudentCount(id: number, count: number) {
        const subscription = await this.findOne(id);
        const plan = subscription.plan;

        // Calculate new monthly amount
        const studentFee = Number(plan.pricePerStudent) * count;
        const baseFee = Number(plan.baseFeeMonthly);
        const currentMonthlyAmount = studentFee + baseFee;

        return this.prisma.subscription.update({
            where: { id },
            data: {
                studentCount: count,
                currentMonthlyAmount,
            },
        });
    }

    async addAddon(subscriptionId: number, addonId: number) {
        const subscription = await this.findOne(subscriptionId);

        // Check if addon already added
        const existing = subscription.addons.find(a => a.addonId === addonId);
        if (existing) {
            throw new BadRequestException('Addon already added');
        }

        return this.prisma.subscriptionAddon.create({
            data: {
                subscriptionId,
                addonId,
                startDate: new Date(),
            },
            include: { addon: true },
        });
    }

    async removeAddon(subscriptionId: number, addonId: number) {
        return this.prisma.subscriptionAddon.delete({
            where: {
                subscriptionId_addonId: { subscriptionId, addonId },
            },
        });
    }

    async getExpiringTrials(days: number = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return this.prisma.subscription.findMany({
            where: {
                status: 'TRIAL',
                trialEndsAt: {
                    lte: futureDate,
                    gte: new Date(),
                },
            },
            include: {
                organization: true,
                plan: true,
            },
        });
    }
}
