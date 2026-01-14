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

        // Calculate outstanding dues for this student
        const allBills = await this.prisma.demandBill.findMany({
            where: {
                studentId: dto.studentId,
                sessionId: dto.sessionId,
            },
        });

        // Calculate total outstanding balance (net amount - paid amount for all bills)
        const outstandingDues = allBills.reduce((sum, bill) => {
            const balance = Number(bill.netAmount) - Number(bill.paidAmount);
            return sum + Math.max(0, balance);
        }, 0);

        // If no outstanding dues and payment is not 'advance', reject the payment
        const isAdvancePayment = dto.paymentMode === 'advance';
        if (outstandingDues <= 0 && !isAdvancePayment) {
            throw new BadRequestException(
                'No outstanding dues for this student. Please use "Advance" payment type for advance payments.'
            );
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
                description: isAdvancePayment ? 'Advance payment' : dto.feeDetails.map(d => `Fee payment`).join(', '),
                paymentMode: dto.paymentMode,
                date: dto.date ? new Date(dto.date) : new Date(),
                yearId: new Date().getFullYear(),
                remarks: isAdvancePayment ? (dto.remarks || 'Advance payment - will be adjusted against future bills') : dto.remarks,
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

        // Skip bill linking for advance payments
        if (isAdvancePayment) {
            return {
                receiptNo: transaction.receiptNo,
                transactionId: transaction.transactionId,
                amount: Number(transaction.amount),
                date: transaction.date,
                isAdvance: true,
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

        // Update demand bill if payment is against a specific bill
        // Priority: 1) dto.billNo, 2) Parse from remarks (legacy), 3) Auto-link to oldest pending bill
        let targetBillNo = dto.billNo;

        if (!targetBillNo && dto.remarks && dto.remarks.includes('Payment for Bill:')) {
            const billNoMatch = dto.remarks.match(/BILL\d+/);
            if (billNoMatch) {
                targetBillNo = billNoMatch[0];
            }
        }

        // Auto-link: If no specific bill, find oldest pending bill for this student
        if (!targetBillNo) {
            const oldestPendingBill = await this.prisma.demandBill.findFirst({
                where: {
                    studentId: dto.studentId,
                    sessionId: dto.sessionId,
                    status: { in: ['PENDING', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
                },
                orderBy: [
                    { year: 'asc' },
                    { month: 'asc' },
                ],
            });
            if (oldestPendingBill) {
                targetBillNo = oldestPendingBill.billNo;
            }
        }

        if (targetBillNo) {
            const demandBill = await this.prisma.demandBill.findUnique({
                where: { billNo: targetBillNo },
                include: { billItems: true },
            });

            if (demandBill) {
                // Calculate dynamic net amount from items (consistent with PDF and dashboard)
                const billGross = demandBill.billItems.reduce((sum, item) => sum + Number(item.amount), 0);
                const billDiscount = Number(demandBill.discount) || 0;
                const previousDues = Number(demandBill.previousDues) || 0;
                const dynamicNetAmount = billGross + previousDues - billDiscount;

                const newPaidAmount = Number(demandBill.paidAmount) + totalAmount;
                let newStatus = demandBill.status;

                // Determine new status based on dynamic net amount
                if (newPaidAmount >= dynamicNetAmount) {
                    newStatus = 'PAID';
                } else if (newPaidAmount > 0) {
                    newStatus = 'PARTIALLY_PAID';
                }

                // Update demand bill with new paid amount and sync netAmount
                await this.prisma.demandBill.update({
                    where: { billNo: targetBillNo },
                    data: {
                        paidAmount: new Decimal(newPaidAmount),
                        netAmount: new Decimal(dynamicNetAmount), // Sync netAmount
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
            // Use stored discount amounts from the database (historical accuracy)
            let billTotalDiscount = 0;

            const billItemsWithDiscount = bill.billItems.map(item => {
                // Use the discount amount that was calculated at generation time
                const discountAmount = Number(item.discountAmount);
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
                // Use stored discount from DB to ensure consistency with generated bills
                // This prevents "retroactive" application of new discounts to old bills
                const itemDiscount = Number(item.discountAmount);

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

        // Calculate dynamic advance balance (Total Paid - Total Billed)
        const advanceBalance = await this.calculateAdvanceBalance(dto.studentId, dto.sessionId);

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
                advanceBalance, // Available advance to apply to future bills
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
        const studentInclude = {
            transport: {
                where: { status: 'active' },
                include: { route: true }
            }
        };

        if (dto.studentId) {
            const student = await this.prisma.studentDetails.findUnique({
                where: { studentId: dto.studentId },
                include: studentInclude,
            });
            if (student) students = [student];
        } else if (dto.studentIds && dto.studentIds.length > 0) {
            students = await this.prisma.studentDetails.findMany({
                where: { studentId: { in: dto.studentIds } },
                include: studentInclude,
            });
        } else {
            const whereClause: any = { status: 'active', sessionId: dto.sessionId };
            if (dto.className) whereClause.className = dto.className;
            if (dto.section) whereClause.section = dto.section;

            students = await this.prisma.studentDetails.findMany({
                where: whereClause,
                include: studentInclude,
            });
        }

        // Fetch Transport Fee Type
        const transportFeeType = await this.prisma.feeType.findFirst({
            where: {
                name: { contains: 'Transport' }, // robust search
            }
        });
        const results: Array<{
            studentId: string;
            billNo?: string;
            status: string;
            amount?: number;
            reason?: string;
        }> = [];
        const billDate = new Date();
        // Due date: 10th of the month following the bill month
        let dueDate: Date;
        if (dto.dueDate) {
            dueDate = new Date(dto.dueDate);
        } else {
            // Calculate next month from bill month/year
            let dueMonth = dto.month + 1;
            let dueYear = dto.year;
            if (dueMonth > 12) {
                dueMonth = 1;
                dueYear += 1;
            }
            dueDate = new Date(dueYear, dueMonth - 1, 10); // 10th of next month
        }

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
                    discountAmount: Decimal;
                }> = [];

                // Filter fee structure items by selected fee types (if provided)
                const itemsToInclude = dto.selectedFeeTypeIds && dto.selectedFeeTypeIds.length > 0
                    ? feeStructure.feeItems.filter(item => dto.selectedFeeTypeIds!.includes(item.feeTypeId))
                    : feeStructure.feeItems;

                for (const item of itemsToInclude) {
                    const amount = Number(item.amount);
                    totalAmount += amount;

                    let itemDiscount = 0;
                    const discount = discounts.find(d => d.feeTypeId === item.feeTypeId);
                    if (discount) {
                        itemDiscount = discount.discountType === 'PERCENTAGE'
                            ? (amount * Number(discount.discountValue)) / 100
                            : Number(discount.discountValue);
                        totalDiscount += itemDiscount;
                    }

                    billItems.push({
                        feeTypeId: item.feeTypeId,
                        amount: new Decimal(amount),
                        discountAmount: new Decimal(itemDiscount),
                    });
                }

                // Add Transport Fee if applicable
                // Only if "Transport Fee" type exists and student has transport assigned
                // And if we are filtering by fee types, only include if Transport Fee is selected
                if (transportFeeType && student.transport && student.transport.route) {
                    const shouldIncludeTransport = !dto.selectedFeeTypeIds || dto.selectedFeeTypeIds.includes(transportFeeType.id);

                    if (shouldIncludeTransport) {
                        const transportAmount = Number(student.transport.route.monthlyFee);
                        totalAmount += transportAmount;

                        // TODO: Implement Transport Discount if needed
                        const transportDiscount = 0;

                        billItems.push({
                            feeTypeId: transportFeeType.id,
                            amount: new Decimal(transportAmount),
                            discountAmount: new Decimal(transportDiscount),
                        });
                    }
                }

                // Auto-calculate and add late fees based on NUMBER OF OVERDUE MONTHS
                // Late Fee = (Late Fee Rate) × (Number of Overdue Months)
                if (dto.autoCalculateLateFees !== false) {
                    // Get late fee from fee structure for this class
                    const lateFeeItem = feeStructure.feeItems.find(
                        item => item.feeType.name === 'Late Fee'
                    );

                    if (lateFeeItem) {
                        // Count how many previous months have unpaid balance
                        const overdueMonths = await this.countOverdueMonths(
                            student.studentId,
                            dto.sessionId,
                            dto.month,
                            dto.year
                        );

                        if (overdueMonths > 0) {
                            const lateFeePerMonth = Number(lateFeeItem.amount);
                            const totalLateFee = lateFeePerMonth * overdueMonths;

                            billItems.push({
                                feeTypeId: lateFeeItem.feeTypeId,
                                amount: new Decimal(totalLateFee),
                                discountAmount: new Decimal(0),
                            });
                            totalAmount += totalLateFee;
                        }
                    }
                }

                const netAmount = totalAmount - totalDiscount + previousDues;
                const billNo = `BILL${dto.year}${String(dto.month).padStart(2, '0')}${Date.now()}`;

                // Calculate available advance (overpayment) and apply to bill
                const availableAdvance = await this.calculateAdvanceBalance(student.studentId, dto.sessionId);
                const advanceToApply = Math.min(availableAdvance, netAmount);
                const finalNetAmount = netAmount - advanceToApply;

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
                        advanceUsed: new Decimal(advanceToApply),
                        discount: new Decimal(totalDiscount),
                        netAmount: new Decimal(finalNetAmount),
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
     * Count the number of overdue months (bills with unpaid balance)
     * Used for per-month late fee calculation
     */
    private async countOverdueMonths(
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

        // Count bills where there's still a balance due (not fully paid)
        return previousBills.filter(bill =>
            Number(bill.netAmount) > Number(bill.paidAmount)
        ).length;
    }

    /**
     * Calculate available advance (overpayment) balance for a student
     * Advance = Total Paid - Total Net Billed
     */
    private async calculateAdvanceBalance(
        studentId: string,
        sessionId: number
    ): Promise<number> {
        // Get total paid from all transactions
        const transactions = await this.prisma.feeTransaction.findMany({
            where: { studentId, sessionId },
        });
        const totalPaid = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

        // Get total billed (net amount) from all demand bills
        const bills = await this.prisma.demandBill.findMany({
            where: { studentId, sessionId },
        });
        const totalBilled = bills.reduce((sum, b) => sum + Number(b.netAmount), 0);

        // Advance is positive if paid more than billed
        return Math.max(0, totalPaid - totalBilled);
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
            // Use stored discount amounts from the database (historical accuracy)
            let billTotalDiscount = 0;

            const billItemsWithDiscount = bill.billItems.map(item => {
                // Use the discount amount that was calculated at generation time
                const discountAmount = Number(item.discountAmount);
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
                advanceUsed: Number(bill.advanceUsed), // Advance applied to this bill
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

        // Student filters
        if (query.studentName || query.className || query.section) {
            whereClause.student = whereClause.student || {};

            if (query.studentName) {
                whereClause.student.name = { contains: query.studentName };
            }
            if (query.className) {
                whereClause.student.className = query.className;
            }
            if (query.section) {
                whereClause.student.section = query.section;
            }
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
            student: {
                name: txn.student.name,
                className: txn.student.className,
                section: txn.student.section,
            },
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
            timestamp: txn.createdAt,
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

            // Check if any bill in the batch has payments
            const hasPayments = batch.bills.some(b => Number(b.paidAmount) > 0);

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
                hasPayments, // True if any bill has linked payments - cannot be deleted
                bills: batch.bills.map(b => ({
                    billNo: b.billNo,
                    studentId: b.student.studentId,
                    studentName: b.student.name,
                    className: b.student.className,
                    section: b.student.section,
                    amount: Number(b.totalAmount),
                    paidAmount: Number(b.paidAmount),
                    previousDues: Number(b.previousDues),
                    advanceUsed: Number(b.advanceUsed),
                    status: b.status,
                    items: b.billItems.map(item => ({
                        feeType: item.feeType.name,
                        amount: Number(item.amount),
                        discount: Number(item.discountAmount)
                    }))
                })),
            };
        });

        return history;
    }


    /**
     * Delete a batch of demand bills
     */
    async deleteDemandBillBatch(billNumbers: string[]) {
        if (!billNumbers || billNumbers.length === 0) {
            return { count: 0 };
        }

        // Verify that bills can be deleted (e.g., not paid)
        // Ideally, we should check if any bill has payments.
        // For now, assuming UI handles simple cases, but safety check is good.
        const paidBills = await this.prisma.demandBill.findMany({
            where: {
                billNo: { in: billNumbers },
                paidAmount: { gt: 0 }
            }
        });

        if (paidBills.length > 0) {
            throw new BadRequestException(`${paidBills.length} bills have already received payments and cannot be deleted.`);
        }

        const result = await this.prisma.demandBill.deleteMany({
            where: {
                billNo: { in: billNumbers }
            }
        });

        return { count: result.count };
    }
}
