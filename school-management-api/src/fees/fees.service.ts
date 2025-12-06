import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CollectFeeDto, FeeStatementDto } from './dto/fee-collection.dto';
import { GenerateDemandBillDto, UpdateBillStatusDto } from './dto/demand-bill.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FeesService {
    constructor(private prisma: PrismaService) { }

    /**
     * Collect fee with multiple fee heads
     */
    async collectFee(dto: CollectFeeDto) {
        // Verify student exists
        const student = await this.prisma.studentDetails.findUnique({
            where: { studentId: dto.studentId },
        });
        if (!student) {
            throw new NotFoundException('Student not found');
        }

        // Calculate total amount
        const totalAmount = dto.feeDetails.reduce((sum, detail) => {
            const netAmount = detail.amount - (detail.discountAmount || 0);
            return sum + netAmount;
        }, 0);

        // Generate receipt number if not provided
        const receiptNo = dto.receiptNo || `REC${Date.now()}`;
        const transactionId = `TXN${Date.now()}`;

        // Create transaction with payment details
        const transaction = await this.prisma.feeTransaction.create({
            data: {
                transactionId,
                studentId: dto.studentId,
                sessionId: dto.sessionId,
                receiptNo,
                amount: new Decimal(totalAmount),
                description: dto.feeDetails.map(d => `Fee payment`).join(', '),
                paymentMode: dto.paymentMode,
                date: dto.date ? new Date(dto.date) : new Date(),
                yearId: new Date().getFullYear(),
                remarks: dto.remarks,
                collectedBy: dto.collectedBy,
                paymentDetails: {
                    create: dto.feeDetails.map(detail => ({
                        feeTypeId: detail.feeTypeId,
                        amount: new Decimal(detail.amount),
                        discountAmount: new Decimal(detail.discountAmount || 0),
                        netAmount: new Decimal(detail.amount - (detail.discountAmount || 0)),
                    })),
                },
            },
            include: {
                paymentDetails: {
                    include: {
                        feeType: true,
                    },
                },
                student: true,
            },
        });

        return {
            receiptNo: transaction.receiptNo,
            transactionId: transaction.transactionId,
            amount: Number(transaction.amount),
            date: transaction.date,
            student: {
                studentId: transaction.student.studentId,
                name: transaction.student.name,
                className: transaction.student.className,
            },
            paymentDetails: transaction.paymentDetails.map(pd => ({
                feeType: pd.feeType.name,
                amount: Number(pd.amount),
                discount: Number(pd.discountAmount),
                netAmount: Number(pd.netAmount),
            })),
        };
    }

    /**
     * Get student fee statement
     */
    async getStudentStatement(dto: FeeStatementDto) {
        const student = await this.prisma.studentDetails.findUnique({
            where: { studentId: dto.studentId },
            include: {
                session: true,
            },
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        // Get fee structure for student's class
        const feeStructure = await this.prisma.feeStructure.findUnique({
            where: {
                sessionId_className: {
                    sessionId: dto.sessionId,
                    className: student.className,
                },
            },
            include: {
                feeItems: {
                    include: {
                        feeType: true,
                    },
                },
            },
        });

        // Get all discounts for student
        const discounts = await this.prisma.studentFeeDiscount.findMany({
            where: {
                studentId: dto.studentId,
                sessionId: dto.sessionId,
            },
            include: {
                feeType: true,
            },
        });

        // Get all transactions
        const whereClause: any = {
            studentId: dto.studentId,
            sessionId: dto.sessionId,
        };

        if (dto.fromDate || dto.toDate) {
            whereClause.date = {};
            if (dto.fromDate) whereClause.date.gte = new Date(dto.fromDate);
            if (dto.toDate) whereClause.date.lte = new Date(dto.toDate);
        }

        const transactions = await this.prisma.feeTransaction.findMany({
            where: whereClause,
            include: {
                paymentDetails: {
                    include: {
                        feeType: true,
                    },
                },
            },
            orderBy: { date: 'asc' },
        });

        // Calculate fee summary
        const feeHeads = feeStructure?.feeItems.map(item => {
            const discount = discounts.find(d => d.feeTypeId === item.feeTypeId);
            const discountAmount = discount
                ? discount.discountType === 'PERCENTAGE'
                    ? (Number(item.amount) * Number(discount.discountValue)) / 100
                    : Number(discount.discountValue)
                : 0;

            const paid = transactions.reduce((sum, txn) => {
                const detail = txn.paymentDetails.find(pd => pd.feeTypeId === item.feeTypeId);
                return sum + (detail ? Number(detail.netAmount) : 0);
            }, 0);

            const netAmount = Number(item.amount) - discountAmount;
            const balance = netAmount - paid;

            return {
                feeTypeId: item.feeTypeId,
                feeType: item.feeType.name,
                grossAmount: Number(item.amount),
                discount: discountAmount,
                netAmount,
                paid,
                balance,
            };
        }) || [];

        const totalGross = feeHeads.reduce((sum, fh) => sum + fh.grossAmount, 0);
        const totalDiscount = feeHeads.reduce((sum, fh) => sum + fh.discount, 0);
        const totalNet = feeHeads.reduce((sum, fh) => sum + fh.netAmount, 0);
        const totalPaid = feeHeads.reduce((sum, fh) => sum + fh.paid, 0);
        const totalDues = feeHeads.reduce((sum, fh) => sum + fh.balance, 0);

        return {
            student: {
                studentId: student.studentId,
                name: student.name,
                fatherName: student.fatherName,
                className: student.className,
                section: student.section,
            },
            session: student.session?.name,
            feeHeads,
            summary: {
                totalGross,
                totalDiscount,
                totalNet,
                totalPaid,
                totalDues,
            },
            transactions: transactions.map(txn => ({
                receiptNo: txn.receiptNo,
                date: txn.date,
                amount: Number(txn.amount),
                paymentMode: txn.paymentMode,
                remarks: txn.remarks,
                details: txn.paymentDetails.map(pd => ({
                    feeType: pd.feeType.name,
                    amount: Number(pd.amount),
                    discount: Number(pd.discountAmount),
                    netAmount: Number(pd.netAmount),
                })),
            })),
        };
    }

    /**
     * Generate demand bills
     */
    async generateDemandBills(dto: GenerateDemandBillDto) {
        const session = await this.prisma.academicSession.findUnique({
            where: { id: dto.sessionId },
        });
        if (!session) {
            throw new NotFoundException('Session not found');
        }

        // Determine which students to generate bills for
        let students: any[] = [];

        if (dto.studentId) {
            const student = await this.prisma.studentDetails.findUnique({
                where: { studentId: dto.studentId },
            });
            if (student) students = [student];
        } else if (dto.studentIds && dto.studentIds.length > 0) {
            students = await this.prisma.studentDetails.findMany({
                where: { studentId: { in: dto.studentIds } },
            });
        } else {
            const whereClause: any = { status: 'active', sessionId: dto.sessionId };
            if (dto.className) whereClause.className = dto.className;
            if (dto.section) whereClause.section = dto.section;

            students = await this.prisma.studentDetails.findMany({
                where: whereClause,
            });
        }

        const results: Array<{
            studentId: string;
            billNo?: string;
            status: string;
            amount?: number;
            reason?: string;
        }> = [];
        const billDate = new Date();
        const dueDate = dto.dueDate ? new Date(dto.dueDate) : new Date(billDate.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

        for (const student of students) {
            try {
                // Check if bill already exists
                const existing = await this.prisma.demandBill.findUnique({
                    where: {
                        studentId_sessionId_month_year: {
                            studentId: student.studentId,
                            sessionId: dto.sessionId,
                            month: dto.month,
                            year: dto.year,
                        },
                    },
                });

                if (existing) {
                    results.push({
                        studentId: student.studentId,
                        status: 'skipped',
                        reason: 'Bill already exists',
                    });
                    continue;
                }

                // Get fee structure
                const feeStructure = await this.prisma.feeStructure.findUnique({
                    where: {
                        sessionId_className: {
                            sessionId: dto.sessionId,
                            className: student.className,
                        },
                    },
                    include: {
                        feeItems: true,
                    },
                });

                if (!feeStructure) {
                    results.push({
                        studentId: student.studentId,
                        status: 'failed',
                        reason: 'Fee structure not found',
                    });
                    continue;
                }

                // Get discounts
                const discounts = await this.prisma.studentFeeDiscount.findMany({
                    where: {
                        studentId: student.studentId,
                        sessionId: dto.sessionId,
                    },
                });

                // Calculate previous dues
                const previousDues = await this.calculatePreviousDues(
                    student.studentId,
                    dto.sessionId,
                    dto.month,
                    dto.year
                );

                // Calculate total and discounts
                let totalAmount = 0;
                let totalDiscount = 0;
                const billItems: Array<{
                    feeTypeId: number;
                    amount: Decimal;
                }> = [];

                for (const item of feeStructure.feeItems) {
                    const amount = Number(item.amount);
                    totalAmount += amount;

                    const discount = discounts.find(d => d.feeTypeId === item.feeTypeId);
                    if (discount) {
                        const discountAmount = discount.discountType === 'PERCENTAGE'
                            ? (amount * Number(discount.discountValue)) / 100
                            : Number(discount.discountValue);
                        totalDiscount += discountAmount;
                    }

                    billItems.push({
                        feeTypeId: item.feeTypeId,
                        amount: new Decimal(amount),
                    });
                }

                const netAmount = totalAmount - totalDiscount + previousDues;
                const billNo = `BILL${dto.year}${String(dto.month).padStart(2, '0')}${Date.now()}`;

                // Create demand bill
                const bill = await this.prisma.demandBill.create({
                    data: {
                        billNo,
                        studentId: student.studentId,
                        sessionId: dto.sessionId,
                        month: dto.month,
                        year: dto.year,
                        billDate,
                        dueDate,
                        totalAmount: new Decimal(totalAmount),
                        previousDues: new Decimal(previousDues),
                        discount: new Decimal(totalDiscount),
                        netAmount: new Decimal(netAmount),
                        billItems: {
                            create: billItems,
                        },
                    },
                });

                results.push({
                    studentId: student.studentId,
                    billNo: bill.billNo,
                    status: 'success',
                    amount: netAmount,
                });
            } catch (error) {
                results.push({
                    studentId: student.studentId,
                    status: 'failed',
                    reason: error.message,
                });
            }
        }

        return {
            total: students.length,
            generated: results.filter(r => r.status === 'success').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            failed: results.filter(r => r.status === 'failed').length,
            results,
        };
    }

    /**
     * Calculate previous dues for a student
     */
    private async calculatePreviousDues(
        studentId: string,
        sessionId: number,
        currentMonth: number,
        currentYear: number
    ): Promise<number> {
        // Get all previous bills
        const previousBills = await this.prisma.demandBill.findMany({
            where: {
                studentId,
                sessionId,
                OR: [
                    { year: { lt: currentYear } },
                    { year: currentYear, month: { lt: currentMonth } },
                ],
            },
        });

        // Calculate total unpaid amount
        return previousBills.reduce((sum, bill) => {
            const unpaid = Number(bill.netAmount) - Number(bill.paidAmount);
            return sum + unpaid;
        }, 0);
    }

    /**
     * Get student fee status dashboard
     */
    async getStudentDashboard(studentId: string, sessionId: number) {
        const statement = await this.getStudentStatement({ studentId, sessionId });

        // Get recent transactions (last 10)
        const recentTransactions = await this.prisma.feeTransaction.findMany({
            where: { studentId, sessionId },
            include: {
                paymentDetails: {
                    include: {
                        feeType: true,
                    },
                },
            },
            orderBy: { date: 'desc' },
            take: 10,
        });

        // Get pending bills
        const pendingBills = await this.prisma.demandBill.findMany({
            where: {
                studentId,
                sessionId,
                status: { in: ['PENDING', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
            },
            orderBy: { dueDate: 'asc' },
        });

        return {
            student: statement.student,
            summary: statement.summary,
            feeHeads: statement.feeHeads,
            recentTransactions: recentTransactions.map(txn => ({
                receiptNo: txn.receiptNo,
                date: txn.date,
                amount: Number(txn.amount),
                paymentMode: txn.paymentMode,
                details: txn.paymentDetails.map(pd => ({
                    feeType: pd.feeType.name,
                    amount: Number(pd.netAmount),
                })),
            })),
            pendingBills: pendingBills.map(bill => ({
                billNo: bill.billNo,
                month: bill.month,
                year: bill.year,
                dueDate: bill.dueDate,
                amount: Number(bill.netAmount),
                paid: Number(bill.paidAmount),
                balance: Number(bill.netAmount) - Number(bill.paidAmount),
                status: bill.status,
            })),
        };
    }

    /**
     * Get yearly fee book for student
     */
    async getYearlyFeeBook(studentId: string, sessionId: number) {
        const statement = await this.getStudentStatement({ studentId, sessionId });

        // Get all transactions grouped by month
        const transactions = await this.prisma.feeTransaction.findMany({
            where: { studentId, sessionId },
            include: {
                paymentDetails: {
                    include: {
                        feeType: true,
                    },
                },
            },
            orderBy: { date: 'asc' },
        });

        // Group by month
        const monthlyData: any = {};
        for (let month = 1; month <= 12; month++) {
            monthlyData[month] = {
                month,
                transactions: [],
                totalPaid: 0,
            };
        }

        transactions.forEach(txn => {
            const month = new Date(txn.date).getMonth() + 1;
            const amount = Number(txn.amount);
            monthlyData[month].transactions.push({
                receiptNo: txn.receiptNo,
                date: txn.date,
                amount,
                paymentMode: txn.paymentMode,
            });
            monthlyData[month].totalPaid += amount;
        });

        return {
            student: statement.student,
            session: statement.session,
            openingBalance: 0, // Can be calculated from previous session
            feeStructure: statement.feeHeads,
            monthlyPayments: Object.values(monthlyData),
            summary: statement.summary,
            closingBalance: statement.summary.totalDues,
        };
    }

    /**
     * Get transactions by date range
     */
    async getTransactions(query: any) {
        const whereClause: any = {};

        if (query.dateFrom) {
            whereClause.date = { gte: new Date(query.dateFrom) };
        }
        if (query.dateTo) {
            if (whereClause.date) {
                whereClause.date.lte = new Date(query.dateTo);
            } else {
                whereClause.date = { lte: new Date(query.dateTo) };
            }
        }
        if (query.studentId) {
            whereClause.studentId = query.studentId;
        }
        if (query.sessionId) {
            whereClause.sessionId = parseInt(query.sessionId);
        }

        const transactions = await this.prisma.feeTransaction.findMany({
            where: whereClause,
            include: {
                student: true,
                paymentDetails: {
                    include: {
                        feeType: true,
                    },
                },
            },
            orderBy: { date: 'desc' },
        });

        return transactions.map(txn => ({
            id: txn.id,
            receiptNo: txn.receiptNo,
            date: txn.date,
            studentId: txn.studentId,
            studentName: txn.student.name,
            className: txn.student.className,
            amount: Number(txn.amount),
            paymentMode: txn.paymentMode,
            description: txn.description,
            remarks: txn.remarks,
            details: txn.paymentDetails.map(pd => ({
                feeType: pd.feeType.name,
                amount: Number(pd.amount),
                discount: Number(pd.discountAmount),
                netAmount: Number(pd.netAmount),
            })),
        }));
    }
}
