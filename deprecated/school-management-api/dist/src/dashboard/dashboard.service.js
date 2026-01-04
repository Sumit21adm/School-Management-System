"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats(period = 'today') {
        const now = new Date();
        let filterStartDate;
        if (period === 'month') {
            filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
            filterStartDate.setHours(0, 0, 0, 0);
        }
        else if (period === 'week') {
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            filterStartDate = new Date(now);
            filterStartDate.setDate(now.getDate() - diff);
            filterStartDate.setHours(0, 0, 0, 0);
        }
        else {
            filterStartDate = new Date(now);
            filterStartDate.setHours(0, 0, 0, 0);
        }
        const totalStudents = await this.prisma.studentDetails.count();
        const activeStudents = await this.prisma.studentDetails.count({
            where: { status: 'active' },
        });
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newStudentsThisMonth = await this.prisma.studentDetails.count({
            where: {
                createdAt: {
                    gte: startOfMonth,
                },
            },
        });
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
                paymentMode: true,
                date: true,
                student: {
                    select: {
                        name: true,
                    },
                },
            },
        });
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map