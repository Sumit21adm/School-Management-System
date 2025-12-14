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
        // Validate feeDetails is not empty
        if (!dto.feeDetails || dto.feeDetails.length === 0) {
            throw new BadRequestException('Fee details cannot be empty');
        }

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

        // Validate amount is greater than zero
        if (totalAmount <= 0) {
            throw new BadRequestException('Total amount must be greater than zero');
        }

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

        // Update demand bill if payment is against a specific bill
        // Priority: 1) dto.billNo, 2) Parse from remarks (legacy)
        let targetBillNo = dto.billNo;

        if (!targetBillNo && dto.remarks && dto.remarks.includes('Payment for Bill:')) {
            const billNoMatch = dto.remarks.match(/BILL\\d+/);
            if (billNoMatch) {
                targetBillNo = billNoMatch[0];
            }
        }

        if (targetBillNo) {
            const demandBill = await this.prisma.demandBill.findUnique({
                where: { billNo: targetBillNo },
            });

            if (demandBill) {
                const newPaidAmount = Number(demandBill.paidAmount) + totalAmount;
                const netAmount = Number(demandBill.netAmount);
                let newStatus = demandBill.status;

                // Determine new status
                if (newPaidAmount >= netAmount) {
                    newStatus = 'PAID';
                } else if (newPaidAmount > 0) {
                    newStatus = 'PARTIALLY_PAID';
                }

                // Update demand bill
                await this.prisma.demandBill.update({
                    where: { billNo: targetBillNo },
                    data: {
                        paidAmount: new Decimal(newPaidAmount),
                        status: newStatus,
                        paidDate: newStatus === 'PAID' ? new Date() : null,
                    },
                });
            }
        }

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

        // Get Pending Bills (Demand Bills)
        const pendingBillsRaw = await this.prisma.demandBill.findMany({
            where: {
                studentId: dto.studentId,
                sessionId: dto.sessionId,
            },
            include: {
                billItems: {
                    include: {
                        feeType: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });



        const pendingBills = pendingBillsRaw.map(bill => {
            // Calculate total discount for this bill based on current active discounts
            let billTotalDiscount = 0;
            const billItemsWithDiscount = bill.billItems.map(item => {
                const discount = discounts.find(d => d.feeTypeId === item.feeTypeId);
                let discountAmount = 0;
                if (discount) {
                    discountAmount = discount.discountType === 'PERCENTAGE'
                        ? (Number(item.amount) * Number(discount.discountValue)) / 100
                        : Number(discount.discountValue);
                }
                billTotalDiscount += discountAmount;
                return {
                    feeType: item.feeType.name,
                    amount: Number(item.amount),
                    discount: discountAmount
                };
            });

            // Recalculate net amount dynamically (Bill Total - Discount)
            // Note: We use bill.totalAmount (Gross) as base, subtract discount, then subtract paid
            const netPayable = Number(bill.totalAmount) - billTotalDiscount;
            const currentBalance = netPayable - Number(bill.paidAmount);

            return {
                id: bill.id,
                billNo: bill.billNo,
                month: bill.month,
                year: bill.year,
                amount: Number(bill.totalAmount),
                paid: Number(bill.paidAmount),
                balance: currentBalance > 0 ? currentBalance : 0, // Ensure no negative balance
                status: bill.status,
                dueDate: bill.dueDate,
                items: billItemsWithDiscount
            };
        });

        // Calculate fee summary
        // Get ALL bills for calculation of Total Fee Demanded
        const allBills = await this.prisma.demandBill.findMany({
            where: {
                studentId: dto.studentId,
                sessionId: dto.sessionId,
            },
            include: {
                billItems: {
                    include: { feeType: true }
                }
            }
        });

        // 1. Aggregate Billed Totals
        const feeTotals = new Map<number, {
            name: string,
            gross: number,
            discount: number
        }>();

        allBills.forEach(bill => {
            bill.billItems.forEach(item => {
                // Consistent Logic: Use Active Discounts to calculate Fee Summary
                // This ensures the Sidebar matches the Pending Bills table (which also uses Active Discounts).
                // If the DB stored discount is 0/outdated, this fixes the "Missing Discount" bug.

                const discountDef = discounts.find(d => d.feeTypeId === item.feeTypeId);
                let itemDiscount = 0;
                if (discountDef) {
                    itemDiscount = discountDef.discountType === 'PERCENTAGE'
                        ? (Number(item.amount) * Number(discountDef.discountValue)) / 100
                        : Number(discountDef.discountValue);
                }

                const current = feeTotals.get(item.feeTypeId) || {
                    name: item.feeType.name,
                    gross: 0,
                    discount: 0
                };

                current.gross += Number(item.amount);
                current.discount += itemDiscount;
                feeTotals.set(item.feeTypeId, current);
            });
        });
        // 2. Also ensure we include items from Fee Structure that haven't been billed yet? 
        // "Fee Head Status" usually implies "Current Status". If never billed, it's not due?
        // But users might want to see "Projected".
        // For now, let's stick to "Billed Actuals" as that syncs with "Outstanding Dues".
        // If we want to show unbilled structure, we'd add them with 0 demanded.

        // 3. Map to Fee Heads result
        const feeHeads = Array.from(feeTotals.entries()).map(([feeTypeId, data]) => {
            const paid = transactions.reduce((sum, txn) => {
                const detail = txn.paymentDetails.find(pd => pd.feeTypeId === feeTypeId);
                return sum + (detail ? Number(detail.netAmount) : 0);
            }, 0);

            const netAmount = data.gross - data.discount;
            const balance = netAmount - paid;

            return {
                feeTypeId: feeTypeId,
                feeType: data.name,
                grossAmount: data.gross,
                discount: data.discount,
                netAmount: netAmount,
                paid,
                balance: balance > 0 ? balance : 0, // Don't show negative balance if overpaid (unless credit logic exists)
            };
        });

        const totalGross = feeHeads.reduce((sum, fh) => sum + fh.grossAmount, 0);
        const totalDiscount = feeHeads.reduce((sum, fh) => sum + fh.discount, 0);
        const totalNet = feeHeads.reduce((sum, fh) => sum + fh.netAmount, 0);
        const totalPaid = feeHeads.reduce((sum, fh) => sum + fh.paid, 0);

        // Calculate Total Dues from feeHeads (consistent with Fee Head Status)
        // This replaces the old pendingBills-based calculation which was out of sync.
        const totalDues = feeHeads.reduce((sum, fh) => sum + fh.balance, 0);

        // Calculate Total Advance (Sum of absolute negative balances)
        const totalAdvance = feeHeads.reduce((sum, fh) => sum + (fh.balance < 0 ? Math.abs(fh.balance) : 0), 0);

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
                totalAdvance, // Expose advance if needed later
            },
            transactions: transactions.map(txn => ({
                id: txn.id,
                date: txn.date,
                amount: Number(txn.amount),
                receiptNo: txn.receiptNo,
                paymentMode: txn.paymentMode,
            })),
            pendingBills,
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
                        feeItems: {
                            include: {
                                feeType: true,
                            },
                        },
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

                // Filter fee structure items by selected fee types (if provided)
                const itemsToInclude = dto.selectedFeeTypeIds && dto.selectedFeeTypeIds.length > 0
                    ? feeStructure.feeItems.filter(item => dto.selectedFeeTypeIds!.includes(item.feeTypeId))
                    : feeStructure.feeItems;

                for (const item of itemsToInclude) {
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

                // Auto-calculate and add late fees if enabled and student has previous dues
                if (dto.autoCalculateLateFees !== false && previousDues > 0) {
                    // Get late fee from fee structure for this class
                    const lateFeeItem = feeStructure.feeItems.find(
                        item => item.feeType.name === 'Late Fee'
                    );

                    if (lateFeeItem) {
                        // Use late fee amount from fee structure
                        const lateFeeAmount = Number(lateFeeItem.amount);

                        billItems.push({
                            feeTypeId: lateFeeItem.feeTypeId,
                            amount: new Decimal(lateFeeAmount),
                        });
                        totalAmount += lateFeeAmount;
                    }
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
                status: { in: ['PENDING', 'SENT', 'PARTIALLY_PAID', 'OVERDUE', 'PAID'] },
            },
            include: {
                billItems: {
                    include: {
                        feeType: true,
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
        });

        // Get all discounts for student
        const discounts = await this.prisma.studentFeeDiscount.findMany({
            where: {
                studentId,
                sessionId,
            },
        });

        const pendingBillsMapped = pendingBills.map(bill => {
            // Calculate total discount for this bill based on current active discounts
            let billTotalDiscount = 0;
            const billItemsWithDiscount = bill.billItems.map(item => {
                const discount = discounts.find(d => d.feeTypeId === item.feeTypeId);
                let discountAmount = 0;
                if (discount) {
                    discountAmount = discount.discountType === 'PERCENTAGE'
                        ? (Number(item.amount) * Number(discount.discountValue)) / 100
                        : Number(discount.discountValue);
                }
                billTotalDiscount += discountAmount;
                return {
                    feeType: item.feeType.name,
                    amount: Number(item.amount),
                    discount: discountAmount,
                };
            });

            // Recalculate net amount dynamically (Bill Total - Discount)
            // Note: We use bill.totalAmount (Gross) as base, subtract discount, then subtract paid
            const netPayable = Number(bill.totalAmount) - billTotalDiscount;
            const currentBalance = netPayable - Number(bill.paidAmount);

            // Determine dynamic status
            let dynamicStatus = bill.status;
            if (currentBalance <= 0) {
                dynamicStatus = 'PAID';
            } else if (Number(bill.paidAmount) > 0) {
                dynamicStatus = 'PARTIALLY_PAID';
            } else if (new Date(bill.dueDate) < new Date() && currentBalance > 0) {
                dynamicStatus = 'OVERDUE';
            } else {
                dynamicStatus = 'PENDING';
            }

            return {
                billNo: bill.billNo,
                month: bill.month,
                year: bill.year,
                dueDate: bill.dueDate,
                amount: Number(bill.totalAmount), // Show Gross
                paid: Number(bill.paidAmount),
                balance: currentBalance > 0 ? currentBalance : 0,
                status: dynamicStatus,
                items: billItemsWithDiscount,
            };
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
            pendingBills: pendingBillsMapped,
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

    /**
     * Get bill generation history - Shows when bills were generated,
     * grouped by timestamp, with details about class, section, and count.
     */
    async getBillGenerationHistory(sessionId: number) {
        // Get all bills grouped by createdAt (rounded to minute for batching)
        const bills = await this.prisma.demandBill.findMany({
            where: { sessionId },
            include: {
                student: {
                    select: {
                        studentId: true,
                        name: true,
                        className: true,
                        section: true,
                    },
                },
                billItems: {
                    include: {
                        feeType: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Group bills by timestamp (rounded to nearest minute for batch detection)
        const batches = new Map<string, {
            timestamp: Date;
            bills: typeof bills;
            classes: Set<string>;
            sections: Set<string>;
            feeTypes: Set<string>;
        }>();

        bills.forEach(bill => {
            // Round to nearest minute for grouping
            const roundedTime = new Date(bill.createdAt);
            roundedTime.setSeconds(0, 0);
            const key = roundedTime.toISOString();

            if (!batches.has(key)) {
                batches.set(key, {
                    timestamp: roundedTime,
                    bills: [],
                    classes: new Set(),
                    sections: new Set(),
                    feeTypes: new Set(),
                });
            }

            const batch = batches.get(key)!;
            batch.bills.push(bill);
            batch.classes.add(bill.student.className);
            batch.sections.add(bill.student.section);
            bill.billItems.forEach(item => batch.feeTypes.add(item.feeType.name));
        });

        // Convert to array format
        const history = Array.from(batches.values()).map(batch => {
            // Determine bill type based on unique classes
            let billType = 'Single Student';
            if (batch.bills.length > 1) {
                if (batch.classes.size === 1 && batch.sections.size === 1) {
                    billType = 'Entire Section';
                } else if (batch.classes.size === 1) {
                    billType = 'Entire Class';
                } else {
                    billType = 'Multiple Classes';
                }
            }

            return {
                timestamp: batch.timestamp,
                billType,
                month: batch.bills[0].month,
                year: batch.bills[0].year,
                classes: Array.from(batch.classes).sort(),
                sections: Array.from(batch.sections).sort(),
                feeTypes: Array.from(batch.feeTypes),
                studentCount: batch.bills.length,
                totalAmount: batch.bills.reduce((sum, b) => sum + Number(b.totalAmount), 0),
                bills: batch.bills.map(b => ({
                    billNo: b.billNo,
                    studentId: b.student.studentId,
                    studentName: b.student.name,
                    className: b.student.className,
                    section: b.student.section,
                    amount: Number(b.totalAmount),
                    status: b.status,
                })),
            };
        });

        return history;
    }
}
