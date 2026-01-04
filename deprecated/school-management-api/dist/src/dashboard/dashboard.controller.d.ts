import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(period?: 'today' | 'week' | 'month'): Promise<{
        students: {
            total: number;
            active: number;
            newThisMonth: number;
        };
        fees: {
            todayCollection: number | import("@prisma/client/runtime/library").Decimal;
            monthCollection: number | import("@prisma/client/runtime/library").Decimal;
        };
        recentAdmissions: {
            id: number;
            name: string;
            createdAt: Date;
            studentId: string;
            className: string;
            section: string;
        }[];
        recentFees: {
            id: number;
            studentId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMode: string;
            date: Date;
            student: {
                name: string;
            };
        }[];
        recentDemandBills: {
            id: number;
            createdAt: Date;
            year: number;
            student: {
                name: string;
                className: string;
                section: string;
            };
            billNo: string;
            month: number;
            dueDate: Date;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
        }[];
        upcomingExams: {
            id: number;
            name: string;
            startDate: Date;
            endDate: Date;
            examType: {
                name: string;
            };
            status: string;
        }[];
        lastUpdated: string;
    }>;
}
