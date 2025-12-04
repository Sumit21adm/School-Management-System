import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        // Get student statistics
        const totalStudents = await this.prisma.studentDetails.count();
        const activeStudents = await this.prisma.studentDetails.count({
            where: { status: 'active' },
        });

        // Get students added this month
        const now = new Date();
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

        // Get recent admissions
        const recentAdmissions = await this.prisma.studentDetails.findMany({
            take: 5,
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

        // Get recent fee transactions
        const recentFees = await this.prisma.feeTransaction.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            select: {
                id: true,
                studentId: true,
                amount: true,
                paymentMode: true,
                date: true,
                student: {
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
        };
    }
}
