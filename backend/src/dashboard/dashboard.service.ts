import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats(period: 'today' | 'week' | 'month' = 'today') {
        // Calculate date range based on period
        const now = new Date();
        let filterStartDate: Date;

        if (period === 'month') {
            // Start of current month
            filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
            filterStartDate.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
            // Get Monday of current week
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
            filterStartDate = new Date(now);
            filterStartDate.setDate(now.getDate() - diff);
            filterStartDate.setHours(0, 0, 0, 0);
        } else {
            // Today
            filterStartDate = new Date(now);
            filterStartDate.setHours(0, 0, 0, 0);
        }

        // Get student statistics
        const totalStudents = await this.prisma.studentDetails.count();
        const activeStudents = await this.prisma.studentDetails.count({
            where: { status: 'active' },
        });

        // Get students added this month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newStudentsThisMonth = await this.prisma.studentDetails.count({
            where: {
                createdAt: {
                    gte: startOfMonth,
                },
            },
        });

        // Get fee statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayCollection = await this.prisma.feeTransaction.aggregate({
            where: {
                date: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            _sum: {
                amount: true,
            },
        });

        // Get this month's collection
        const monthCollection = await this.prisma.feeTransaction.aggregate({
            where: {
                date: {
                    gte: startOfMonth,
                },
            },
            _sum: {
                amount: true,
            },
        });

        // Get recent admissions (filtered by period)
        const recentAdmissions = await this.prisma.studentDetails.findMany({
            where: {
                createdAt: {
                    gte: filterStartDate,
                },
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                studentId: true,
                name: true,
                className: true,
                section: true,
                createdAt: true,
            },
        });

        // Get recent fee transactions (filtered by period)
        const recentFees = await this.prisma.feeTransaction.findMany({
            where: {
                date: {
                    gte: filterStartDate,
                },
            },
            take: 10,
            orderBy: { date: 'desc' },
            select: {
                id: true,
                studentId: true,
                amount: true,
                paymentModeDetails: true,
                date: true,
                student: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        // Get recent demand bills (filtered by period)
        const recentDemandBills = await this.prisma.demandBill.findMany({
            where: {
                createdAt: {
                    gte: filterStartDate,
                },
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                billNo: true,
                totalAmount: true,
                dueDate: true,
                month: true,
                year: true,
                createdAt: true,
                student: {
                    select: {
                        name: true,
                        className: true,
                        section: true,
                    },
                },
            },
        });

        // Get upcoming exams (next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const upcomingExams = await this.prisma.exam.findMany({
            where: {
                startDate: {
                    gte: new Date(),
                    lte: thirtyDaysFromNow,
                },
            },
            take: 5,
            orderBy: { startDate: 'asc' },
            select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                status: true,
                examType: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return {
            students: {
                total: totalStudents,
                active: activeStudents,
                newThisMonth: newStudentsThisMonth,
            },
            fees: {
                todayCollection: todayCollection._sum?.amount || 0,
                monthCollection: monthCollection._sum?.amount || 0,
            },
            recentAdmissions,
            recentFees,
            recentDemandBills,
            upcomingExams,
            lastUpdated: new Date().toISOString(),
        };
    }
}
