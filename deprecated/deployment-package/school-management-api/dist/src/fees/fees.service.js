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
exports.FeesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let FeesService = class FeesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async collectFee(dto) {
        if (!dto.feeDetails || dto.feeDetails.length === 0) {
            throw new common_1.BadRequestException('Fee details cannot be empty');
        }
        const student = await this.prisma.studentDetails.findUnique({
            where: { studentId: dto.studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const totalAmount = dto.feeDetails.reduce((sum, detail) => {
            const netAmount = detail.amount - (detail.discountAmount || 0);
            return sum + netAmount;
        }, 0);
        if (totalAmount <= 0) {
            throw new common_1.BadRequestException('Total amount must be greater than zero');
        }
        const receiptNo = dto.receiptNo || `REC${Date.now()}`;
        const transactionId = `TXN${Date.now()}`;
        const transaction = await this.prisma.feeTransaction.create({
            data: {
                transactionId,
                studentId: dto.studentId,
                sessionId: dto.sessionId,
                receiptNo,
                amount: new library_1.Decimal(totalAmount),
                description: dto.feeDetails.map(d => `Fee payment`).join(', '),
                paymentMode: dto.paymentMode,
                date: dto.date ? new Date(dto.date) : new Date(),
                yearId: new Date().getFullYear(),
                remarks: dto.remarks,
                collectedBy: dto.collectedBy,
                paymentDetails: {
                    create: dto.feeDetails.map(detail => ({
                        feeTypeId: detail.feeTypeId,
                        amount: new library_1.Decimal(detail.amount),
                        discountAmount: new library_1.Decimal(detail.discountAmount || 0),
                        netAmount: new library_1.Decimal(detail.amount - (detail.discountAmount || 0)),
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
        let targetBillNo = dto.billNo;
        if (!targetBillNo && dto.remarks && dto.remarks.includes('Payment for Bill:')) {
            const billNoMatch = dto.remarks.match(/BILL\d+/);
            if (billNoMatch) {
                targetBillNo = billNoMatch[0];
            }
        }
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
                const billGross = demandBill.billItems.reduce((sum, item) => sum + Number(item.amount), 0);
                const billDiscount = Number(demandBill.discount) || 0;
                const previousDues = Number(demandBill.previousDues) || 0;
                const dynamicNetAmount = billGross + previousDues - billDiscount;
                const newPaidAmount = Number(demandBill.paidAmount) + totalAmount;
                let newStatus = demandBill.status;
                if (newPaidAmount >= dynamicNetAmount) {
                    newStatus = 'PAID';
                }
                else if (newPaidAmount > 0) {
                    newStatus = 'PARTIALLY_PAID';
                }
                await this.prisma.demandBill.update({
                    where: { billNo: targetBillNo },
                    data: {
                        paidAmount: new library_1.Decimal(newPaidAmount),
                        netAmount: new library_1.Decimal(dynamicNetAmount),
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
    async getStudentStatement(dto) {
        const student = await this.prisma.studentDetails.findUnique({
            where: { studentId: dto.studentId },
            include: {
                session: true,
            },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
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
        const discounts = await this.prisma.studentFeeDiscount.findMany({
            where: {
                studentId: dto.studentId,
                sessionId: dto.sessionId,
            },
            include: {
                feeType: true,
            },
        });
        const whereClause = {
            studentId: dto.studentId,
            sessionId: dto.sessionId,
        };
        if (dto.fromDate || dto.toDate) {
            whereClause.date = {};
            if (dto.fromDate)
                whereClause.date.gte = new Date(dto.fromDate);
            if (dto.toDate)
                whereClause.date.lte = new Date(dto.toDate);
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
            let billTotalDiscount = 0;
            const billItemsWithDiscount = bill.billItems.map(item => {
                const discountAmount = Number(item.discountAmount);
                billTotalDiscount += discountAmount;
                return {
                    feeType: item.feeType.name,
                    amount: Number(item.amount),
                    discount: discountAmount
                };
            });
            const netPayable = Number(bill.totalAmount) - billTotalDiscount;
            const currentBalance = netPayable - Number(bill.paidAmount);
            return {
                id: bill.id,
                billNo: bill.billNo,
                month: bill.month,
                year: bill.year,
                amount: Number(bill.totalAmount),
                paid: Number(bill.paidAmount),
                balance: currentBalance > 0 ? currentBalance : 0,
                status: bill.status,
                dueDate: bill.dueDate,
                items: billItemsWithDiscount
            };
        });
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
        const feeTotals = new Map();
        allBills.forEach(bill => {
            bill.billItems.forEach(item => {
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
                balance: balance > 0 ? balance : 0,
            };
        });
        const totalGross = feeHeads.reduce((sum, fh) => sum + fh.grossAmount, 0);
        const totalDiscount = feeHeads.reduce((sum, fh) => sum + fh.discount, 0);
        const totalNet = feeHeads.reduce((sum, fh) => sum + fh.netAmount, 0);
        const totalPaid = feeHeads.reduce((sum, fh) => sum + fh.paid, 0);
        const totalDues = feeHeads.reduce((sum, fh) => sum + fh.balance, 0);
        const totalAdvance = feeHeads.reduce((sum, fh) => sum + (fh.balance < 0 ? Math.abs(fh.balance) : 0), 0);
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
                totalAdvance,
                advanceBalance,
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
    async generateDemandBills(dto) {
        const session = await this.prisma.academicSession.findUnique({
            where: { id: dto.sessionId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        let students = [];
        if (dto.studentId) {
            const student = await this.prisma.studentDetails.findUnique({
                where: { studentId: dto.studentId },
            });
            if (student)
                students = [student];
        }
        else if (dto.studentIds && dto.studentIds.length > 0) {
            students = await this.prisma.studentDetails.findMany({
                where: { studentId: { in: dto.studentIds } },
            });
        }
        else {
            const whereClause = { status: 'active', sessionId: dto.sessionId };
            if (dto.className)
                whereClause.className = dto.className;
            if (dto.section)
                whereClause.section = dto.section;
            students = await this.prisma.studentDetails.findMany({
                where: whereClause,
            });
        }
        const results = [];
        const billDate = new Date();
        const dueDate = dto.dueDate ? new Date(dto.dueDate) : new Date(billDate.getTime() + 15 * 24 * 60 * 60 * 1000);
        for (const student of students) {
            try {
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
                const discounts = await this.prisma.studentFeeDiscount.findMany({
                    where: {
                        studentId: student.studentId,
                        sessionId: dto.sessionId,
                    },
                });
                const previousDues = await this.calculatePreviousDues(student.studentId, dto.sessionId, dto.month, dto.year);
                let totalAmount = 0;
                let totalDiscount = 0;
                const billItems = [];
                const itemsToInclude = dto.selectedFeeTypeIds && dto.selectedFeeTypeIds.length > 0
                    ? feeStructure.feeItems.filter(item => dto.selectedFeeTypeIds.includes(item.feeTypeId))
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
                        amount: new library_1.Decimal(amount),
                        discountAmount: new library_1.Decimal(itemDiscount),
                    });
                }
                if (dto.autoCalculateLateFees !== false) {
                    const lateFeeItem = feeStructure.feeItems.find(item => item.feeType.name === 'Late Fee');
                    if (lateFeeItem) {
                        const overdueMonths = await this.countOverdueMonths(student.studentId, dto.sessionId, dto.month, dto.year);
                        if (overdueMonths > 0) {
                            const lateFeePerMonth = Number(lateFeeItem.amount);
                            const totalLateFee = lateFeePerMonth * overdueMonths;
                            billItems.push({
                                feeTypeId: lateFeeItem.feeTypeId,
                                amount: new library_1.Decimal(totalLateFee),
                                discountAmount: new library_1.Decimal(0),
                            });
                            totalAmount += totalLateFee;
                        }
                    }
                }
                const netAmount = totalAmount - totalDiscount + previousDues;
                const billNo = `BILL${dto.year}${String(dto.month).padStart(2, '0')}${Date.now()}`;
                const availableAdvance = await this.calculateAdvanceBalance(student.studentId, dto.sessionId);
                const advanceToApply = Math.min(availableAdvance, netAmount);
                const finalNetAmount = netAmount - advanceToApply;
                const bill = await this.prisma.demandBill.create({
                    data: {
                        billNo,
                        studentId: student.studentId,
                        sessionId: dto.sessionId,
                        month: dto.month,
                        year: dto.year,
                        billDate,
                        dueDate,
                        totalAmount: new library_1.Decimal(totalAmount),
                        previousDues: new library_1.Decimal(previousDues),
                        advanceUsed: new library_1.Decimal(advanceToApply),
                        discount: new library_1.Decimal(totalDiscount),
                        netAmount: new library_1.Decimal(finalNetAmount),
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
            }
            catch (error) {
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
    async calculatePreviousDues(studentId, sessionId, currentMonth, currentYear) {
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
        return previousBills.reduce((sum, bill) => {
            const unpaid = Number(bill.netAmount) - Number(bill.paidAmount);
            return sum + unpaid;
        }, 0);
    }
    async countOverdueMonths(studentId, sessionId, currentMonth, currentYear) {
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
        return previousBills.filter(bill => Number(bill.netAmount) > Number(bill.paidAmount)).length;
    }
    async calculateAdvanceBalance(studentId, sessionId) {
        const transactions = await this.prisma.feeTransaction.findMany({
            where: { studentId, sessionId },
        });
        const totalPaid = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const bills = await this.prisma.demandBill.findMany({
            where: { studentId, sessionId },
        });
        const totalBilled = bills.reduce((sum, b) => sum + Number(b.netAmount), 0);
        return Math.max(0, totalPaid - totalBilled);
    }
    async getStudentDashboard(studentId, sessionId) {
        const statement = await this.getStudentStatement({ studentId, sessionId });
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
        const discounts = await this.prisma.studentFeeDiscount.findMany({
            where: {
                studentId,
                sessionId,
            },
        });
        const pendingBillsMapped = pendingBills.map(bill => {
            let billTotalDiscount = 0;
            const billItemsWithDiscount = bill.billItems.map(item => {
                const discountAmount = Number(item.discountAmount);
                billTotalDiscount += discountAmount;
                return {
                    feeType: item.feeType.name,
                    amount: Number(item.amount),
                    discount: discountAmount,
                };
            });
            const netPayable = Number(bill.totalAmount) - billTotalDiscount;
            const currentBalance = netPayable - Number(bill.paidAmount);
            let dynamicStatus = bill.status;
            if (currentBalance <= 0) {
                dynamicStatus = 'PAID';
            }
            else if (Number(bill.paidAmount) > 0) {
                dynamicStatus = 'PARTIALLY_PAID';
            }
            else if (new Date(bill.dueDate) < new Date() && currentBalance > 0) {
                dynamicStatus = 'OVERDUE';
            }
            else {
                dynamicStatus = 'PENDING';
            }
            return {
                billNo: bill.billNo,
                month: bill.month,
                year: bill.year,
                dueDate: bill.dueDate,
                amount: Number(bill.totalAmount),
                advanceUsed: Number(bill.advanceUsed),
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
    async getYearlyFeeBook(studentId, sessionId) {
        const statement = await this.getStudentStatement({ studentId, sessionId });
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
        const monthlyData = {};
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
            openingBalance: 0,
            feeStructure: statement.feeHeads,
            monthlyPayments: Object.values(monthlyData),
            summary: statement.summary,
            closingBalance: statement.summary.totalDues,
        };
    }
    async getTransactions(query) {
        const whereClause = {};
        if (query.dateFrom) {
            whereClause.date = { gte: new Date(query.dateFrom) };
        }
        if (query.dateTo) {
            if (whereClause.date) {
                whereClause.date.lte = new Date(query.dateTo);
            }
            else {
                whereClause.date = { lte: new Date(query.dateTo) };
            }
        }
        if (query.studentId) {
            whereClause.studentId = query.studentId;
        }
        if (query.sessionId) {
            whereClause.sessionId = parseInt(query.sessionId);
        }
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
            timestamp: txn.createdAt,
        }));
    }
    async getBillGenerationHistory(sessionId) {
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
        const batches = new Map();
        bills.forEach(bill => {
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
            const batch = batches.get(key);
            batch.bills.push(bill);
            batch.classes.add(bill.student.className);
            batch.sections.add(bill.student.section);
            bill.billItems.forEach(item => batch.feeTypes.add(item.feeType.name));
        });
        const history = Array.from(batches.values()).map(batch => {
            let billType = 'Single Student';
            if (batch.bills.length > 1) {
                if (batch.classes.size === 1 && batch.sections.size === 1) {
                    billType = 'Entire Section';
                }
                else if (batch.classes.size === 1) {
                    billType = 'Entire Class';
                }
                else {
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
};
exports.FeesService = FeesService;
exports.FeesService = FeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FeesService);
//# sourceMappingURL=fees.service.js.map