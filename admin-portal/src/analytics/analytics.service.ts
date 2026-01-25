import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        const [
            orgStats,
            subscriptionStats,
            revenueStats,
            recentOrgs,
            expiringTrials,
        ] = await Promise.all([
            this.getOrgStats(),
            this.getSubscriptionStats(),
            this.getRevenueStats(),
            this.getRecentOrganizations(),
            this.getExpiringTrials(),
        ]);

        return {
            organizations: orgStats,
            subscriptions: subscriptionStats,
            revenue: revenueStats,
            recentOrganizations: recentOrgs,
            expiringTrials,
        };
    }

    async getOrgStats() {
        const [total, trial, active, suspended] = await Promise.all([
            this.prisma.organization.count(),
            this.prisma.organization.count({ where: { status: 'TRIAL' } }),
            this.prisma.organization.count({ where: { status: 'ACTIVE' } }),
            this.prisma.organization.count({ where: { status: 'SUSPENDED' } }),
        ]);

        return { total, trial, active, suspended };
    }

    async getSubscriptionStats() {
        const [total, byPlan] = await Promise.all([
            this.prisma.subscription.count({ where: { status: { in: ['TRIAL', 'ACTIVE'] } } }),
            this.prisma.subscription.groupBy({
                by: ['planId'],
                _count: true,
                where: { status: { in: ['TRIAL', 'ACTIVE'] } },
            }),
        ]);

        // Get plan names
        const plans = await this.prisma.subscriptionPlan.findMany();
        const planMap = new Map(plans.map(p => [p.id, p.name]));

        const byPlanWithNames = byPlan.map(item => ({
            planName: planMap.get(item.planId) || 'Unknown',
            count: item._count,
        }));

        return { total, byPlan: byPlanWithNames };
    }

    async getRevenueStats() {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [thisMonthRevenue, lastMonthRevenue, totalRevenue] = await Promise.all([
            this.prisma.invoice.aggregate({
                where: { status: 'PAID', paidAt: { gte: thisMonth } },
                _sum: { total: true },
            }),
            this.prisma.invoice.aggregate({
                where: { status: 'PAID', paidAt: { gte: lastMonth, lt: thisMonth } },
                _sum: { total: true },
            }),
            this.prisma.invoice.aggregate({
                where: { status: 'PAID' },
                _sum: { total: true },
            }),
        ]);

        const thisMonthAmount = Number(thisMonthRevenue._sum.total || 0);
        const lastMonthAmount = Number(lastMonthRevenue._sum.total || 0);
        const growth = lastMonthAmount > 0
            ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount * 100).toFixed(1)
            : 0;

        return {
            thisMonth: thisMonthAmount,
            lastMonth: lastMonthAmount,
            total: Number(totalRevenue._sum.total || 0),
            growthPercent: growth,
        };
    }

    async getRecentOrganizations(limit = 5) {
        return this.prisma.organization.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                createdAt: true,
            },
        });
    }

    async getExpiringTrials(days = 7) {
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
                organization: { select: { id: true, name: true, email: true } },
                plan: { select: { name: true } },
            },
            orderBy: { trialEndsAt: 'asc' },
        });
    }

    async getMonthlyRevenueTrend(months = 6) {
        const results = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const revenue = await this.prisma.invoice.aggregate({
                where: {
                    status: 'PAID',
                    paidAt: { gte: start, lt: end },
                },
                _sum: { total: true },
            });

            results.push({
                month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
                revenue: Number(revenue._sum.total || 0),
            });
        }

        return results;
    }
}
