import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/fees/reports/fee-book
 * 
 * Returns yearly fee book for a student with monthly breakdown
 * Ported from legacy fees.service.ts getYearlyFeeBook()
 * Query params: studentId (required), sessionId (required)
 */
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const sessionId = searchParams.get('sessionId');

        if (!studentId || !sessionId) {
            return NextResponse.json({ error: 'studentId and sessionId are required' }, { status: 400 });
        }

        // Get student info
        const student = await prisma.studentDetails.findUnique({
            where: { studentId },
            include: {
                session: { select: { name: true } }
            }
        });

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Get fee structure for this class/session
        const feeStructure = await prisma.feeStructure.findUnique({
            where: {
                sessionId_className: {
                    sessionId: parseInt(sessionId),
                    className: student.className
                }
            },
            include: {
                feeItems: {
                    include: { feeType: true }
                }
            }
        });

        // Get all transactions for this student
        const transactions = await prisma.feeTransaction.findMany({
            where: {
                studentId,
                sessionId: parseInt(sessionId)
            },
            include: {
                paymentDetails: {
                    include: { feeType: true }
                }
            },
            orderBy: { date: 'asc' }
        });

        // Get all demand bills
        const demandBills = await prisma.demandBill.findMany({
            where: {
                studentId,
                sessionId: parseInt(sessionId)
            },
            include: {
                billItems: {
                    include: { feeType: true }
                }
            },
            orderBy: [{ year: 'asc' }, { month: 'asc' }]
        });

        // Group transactions by month
        const monthlyData: Record<number, {
            month: number;
            transactions: Array<{
                receiptNo: string;
                date: Date;
                amount: number;
                paymentMode: string;
            }>;
            totalPaid: number;
        }> = {};

        // Initialize all 12 months
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

        // Calculate fee head summary
        const feeHeadSummary: Array<{
            feeTypeId: number;
            feeType: string;
            structureAmount: number;
            totalBilled: number;
            totalPaid: number;
            balance: number;
        }> = [];

        // Build fee head summary from bills and payments
        const feeTypeMap = new Map<number, {
            name: string;
            structureAmount: number;
            billed: number;
            paid: number;
        }>();

        // Add from fee structure
        feeStructure?.feeItems.forEach(item => {
            feeTypeMap.set(item.feeTypeId, {
                name: item.feeType.name,
                structureAmount: Number(item.amount),
                billed: 0,
                paid: 0
            });
        });

        // Add from bills
        demandBills.forEach(bill => {
            bill.billItems.forEach(item => {
                const existing = feeTypeMap.get(item.feeTypeId);
                if (existing) {
                    existing.billed += Number(item.amount);
                } else {
                    feeTypeMap.set(item.feeTypeId, {
                        name: item.feeType.name,
                        structureAmount: 0,
                        billed: Number(item.amount),
                        paid: 0
                    });
                }
            });
        });

        // Add from payments
        transactions.forEach(txn => {
            txn.paymentDetails.forEach(pd => {
                const existing = feeTypeMap.get(pd.feeTypeId);
                if (existing) {
                    existing.paid += Number(pd.netAmount);
                }
            });
        });

        feeTypeMap.forEach((data, feeTypeId) => {
            feeHeadSummary.push({
                feeTypeId,
                feeType: data.name,
                structureAmount: data.structureAmount,
                totalBilled: data.billed,
                totalPaid: data.paid,
                balance: data.billed - data.paid
            });
        });

        // Calculate totals
        const totalBilled = feeHeadSummary.reduce((sum, fh) => sum + fh.totalBilled, 0);
        const totalPaid = feeHeadSummary.reduce((sum, fh) => sum + fh.totalPaid, 0);
        const totalBalance = totalBilled - totalPaid;

        // Bills summary
        const billsSummary = demandBills.map(bill => ({
            billNo: bill.billNo,
            month: bill.month,
            year: bill.year,
            grossAmount: Number(bill.totalAmount),
            discount: Number(bill.discount),
            previousDues: Number(bill.previousDues),
            netAmount: Number(bill.netAmount),
            paidAmount: Number(bill.paidAmount),
            balance: Number(bill.netAmount) - Number(bill.paidAmount),
            status: bill.status,
            dueDate: bill.dueDate
        }));

        return NextResponse.json({
            student: {
                studentId: student.studentId,
                name: student.name,
                fatherName: student.fatherName,
                className: student.className,
                section: student.section,
                rollNo: '', // Not stored in StudentDetails
                admissionNo: student.studentId // Use studentId as admission number
            },
            session: student.session?.name,
            generatedAt: new Date().toISOString(),
            feeStructure: feeStructure?.feeItems.map(item => ({
                feeTypeId: item.feeTypeId,
                feeType: item.feeType.name,
                amount: Number(item.amount),
                frequency: item.feeType.frequency
            })) || [],
            feeHeadSummary,
            monthlyPayments: Object.values(monthlyData),
            bills: billsSummary,
            summary: {
                totalBilled,
                totalPaid,
                totalBalance,
                openingBalance: 0, // Could be calculated from previous session
                closingBalance: totalBalance
            }
        });

    } catch (error) {
        console.error('Error generating fee book:', error);
        return NextResponse.json({ error: 'Failed to generate fee book' }, { status: 500 });
    }
}
