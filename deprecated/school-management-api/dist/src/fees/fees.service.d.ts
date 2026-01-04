import { PrismaService } from '../prisma.service';
import { CollectFeeDto, FeeStatementDto } from './dto/fee-collection.dto';
import { GenerateDemandBillDto } from './dto/demand-bill.dto';
export declare class FeesService {
    private prisma;
    constructor(prisma: PrismaService);
    collectFee(dto: CollectFeeDto): Promise<{
        receiptNo: string;
        transactionId: string;
        amount: number;
        date: Date;
        student: {
            studentId: string;
            name: string;
            className: string;
        };
        paymentDetails: {
            feeType: string;
            amount: number;
            discount: number;
            netAmount: number;
        }[];
    }>;
    getStudentStatement(dto: FeeStatementDto): Promise<{
        student: {
            studentId: string;
            name: string;
            fatherName: string;
            className: string;
            section: string;
        };
        session: string | undefined;
        feeHeads: {
            feeTypeId: number;
            feeType: string;
            grossAmount: number;
            discount: number;
            netAmount: number;
            paid: number;
            balance: number;
        }[];
        summary: {
            totalGross: number;
            totalDiscount: number;
            totalNet: number;
            totalPaid: number;
            totalDues: number;
            totalAdvance: number;
            advanceBalance: number;
        };
        transactions: {
            id: number;
            date: Date;
            amount: number;
            receiptNo: string;
            paymentMode: string;
        }[];
        pendingBills: {
            id: number;
            billNo: string;
            month: number;
            year: number;
            amount: number;
            paid: number;
            balance: number;
            status: import("@prisma/client").$Enums.BillStatus;
            dueDate: Date;
            items: {
                feeType: string;
                amount: number;
                discount: number;
            }[];
        }[];
    }>;
    generateDemandBills(dto: GenerateDemandBillDto): Promise<{
        total: number;
        generated: number;
        skipped: number;
        failed: number;
        results: {
            studentId: string;
            billNo?: string;
            status: string;
            amount?: number;
            reason?: string;
        }[];
    }>;
    private calculatePreviousDues;
    private countOverdueMonths;
    private calculateAdvanceBalance;
    getStudentDashboard(studentId: string, sessionId: number): Promise<{
        student: {
            studentId: string;
            name: string;
            fatherName: string;
            className: string;
            section: string;
        };
        summary: {
            totalGross: number;
            totalDiscount: number;
            totalNet: number;
            totalPaid: number;
            totalDues: number;
            totalAdvance: number;
            advanceBalance: number;
        };
        feeHeads: {
            feeTypeId: number;
            feeType: string;
            grossAmount: number;
            discount: number;
            netAmount: number;
            paid: number;
            balance: number;
        }[];
        recentTransactions: {
            receiptNo: string;
            date: Date;
            amount: number;
            paymentMode: string;
            details: {
                feeType: string;
                amount: number;
            }[];
        }[];
        pendingBills: {
            billNo: string;
            month: number;
            year: number;
            dueDate: Date;
            amount: number;
            advanceUsed: number;
            paid: number;
            balance: number;
            status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
            items: {
                feeType: string;
                amount: number;
                discount: number;
            }[];
        }[];
    }>;
    getYearlyFeeBook(studentId: string, sessionId: number): Promise<{
        student: {
            studentId: string;
            name: string;
            fatherName: string;
            className: string;
            section: string;
        };
        session: string | undefined;
        openingBalance: number;
        feeStructure: {
            feeTypeId: number;
            feeType: string;
            grossAmount: number;
            discount: number;
            netAmount: number;
            paid: number;
            balance: number;
        }[];
        monthlyPayments: unknown[];
        summary: {
            totalGross: number;
            totalDiscount: number;
            totalNet: number;
            totalPaid: number;
            totalDues: number;
            totalAdvance: number;
            advanceBalance: number;
        };
        closingBalance: number;
    }>;
    getTransactions(query: any): Promise<{
        id: number;
        receiptNo: string;
        date: Date;
        studentId: string;
        studentName: string;
        className: string;
        amount: number;
        paymentMode: string;
        description: string;
        remarks: string | null;
        details: {
            feeType: string;
            amount: number;
            discount: number;
            netAmount: number;
        }[];
        timestamp: Date;
    }[]>;
    getBillGenerationHistory(sessionId: number): Promise<{
        timestamp: Date;
        billType: string;
        month: number;
        year: number;
        classes: string[];
        sections: string[];
        feeTypes: string[];
        studentCount: number;
        totalAmount: number;
        bills: {
            billNo: string;
            studentId: string;
            studentName: string;
            className: string;
            section: string;
            amount: number;
            status: import("@prisma/client").$Enums.BillStatus;
        }[];
    }[]>;
}
