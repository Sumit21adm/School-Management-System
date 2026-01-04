import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET student fee statement - comprehensive fee history
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { studentId } = await params;
        const { searchParams } = new URL(request.url);
        const sessionId = parseInt(searchParams.get('sessionId') || '0');

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
        }

        // Get student details
        const student = await prisma.studentDetails.findFirst({
            where: { studentId },
            include: { session: true },
        });

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Get fee structure for student's class
        const feeStructure = await prisma.feeStructure.findUnique({
            where: {
                sessionId_className: { sessionId, className: student.className },
            },
            include: {
                feeItems: {
                    include: { feeType: true },
                },
            },
        });

        // Get all demand bills
        const demandBills = await prisma.demandBill.findMany({
            where: { studentId, sessionId },
            include: {
                billItems: {
                    include: { feeType: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Get all transactions (payments)
        const transactions = await prisma.feeTransaction.findMany({
            where: { studentId, sessionId },
            include: {
                paymentDetails: {
                    include: { feeType: true },
                },
            },
            orderBy: { date: 'asc' },
        });

        // Get discounts
        const discounts = await prisma.studentFeeDiscount.findMany({
            where: { studentId, sessionId },
            include: { feeType: true },
        });

        // Calculate totals
        const totalBilled = demandBills.reduce((sum, bill) => sum + Number(bill.netAmount), 0);
        const totalPaid = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
        const totalDiscount = discounts.reduce((sum, d) => sum + Number(d.discountValue), 0);

        // Calculate advance balance (overpayment)
        const advanceBalance = Math.max(0, totalPaid - totalBilled);

        // Calculate dues
        const dueAmount = Math.max(0, totalBilled - totalPaid);

        // Build monthly breakdown
        const monthlyBreakdown = buildMonthlyBreakdown(demandBills, transactions);

        return NextResponse.json({
            student: {
                id: student.id,
                studentId: student.studentId,
                name: student.name,
                className: student.className,
                section: student.section,
                fatherName: student.fatherName,
            },
            session: student.session,
            feeStructure: feeStructure?.feeItems.map(item => ({
                feeTypeId: item.feeTypeId,
                feeTypeName: item.feeType.name,
                amount: Number(item.amount),
                isOptional: item.isOptional,
            })) || [],
            demandBills: demandBills.map(bill => ({
                billNo: bill.billNo,
                month: bill.month,
                year: bill.year,
                totalAmount: Number(bill.totalAmount),
                discount: Number(bill.discount),
                netAmount: Number(bill.netAmount),
                paidAmount: Number(bill.paidAmount),
                status: bill.status,
                createdAt: bill.createdAt,
                items: bill.billItems.map((item: any) => ({
                    feeTypeName: item.feeType.name,
                    amount: Number(item.amount),
                    discountAmount: Number(item.discountAmount),
                })),
            })),
            transactions: transactions.map(tx => ({
                transactionId: tx.transactionId,
                receiptNo: tx.receiptNo,
                amount: Number(tx.amount),
                paymentMode: tx.paymentMode,
                date: tx.date,
                collectedBy: tx.collectedBy,
                details: tx.paymentDetails.map(pd => ({
                    feeTypeName: pd.feeType.name,
                    amount: Number(pd.amount),
                })),
            })),
            discounts: discounts.map(d => ({
                feeTypeName: d.feeType.name,
                discountType: d.discountType,
                discountValue: Number(d.discountValue),
                reason: d.reason,
            })),
            summary: {
                totalBilled,
                totalPaid,
                totalDiscount,
                dueAmount,
                advanceBalance,
            },
            monthlyBreakdown,
        });
    } catch (error) {
        console.error('Error fetching fee statement:', error);
        return NextResponse.json({ error: 'Failed to fetch fee statement' }, { status: 500 });
    }
}

// Helper to build monthly breakdown
function buildMonthlyBreakdown(demandBills: any[], transactions: any[]) {
    const months = [
        'April', 'May', 'June', 'July', 'August', 'September',
        'October', 'November', 'December', 'January', 'February', 'March'
    ];

    return months.map((monthName, index) => {
        // Find bill for this month
        const monthNum = index < 9 ? index + 4 : index - 8; // April=4, March=3
        const bill = demandBills.find(b => b.month === monthNum);

        // Sum transactions for this month
        const monthTransactions = transactions.filter(tx => {
            const txMonth = new Date(tx.date).getMonth() + 1;
            return txMonth === monthNum;
        });
        const paidThisMonth = monthTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

        return {
            month: monthName,
            monthNum,
            billed: bill ? Number(bill.netAmount) : 0,
            paid: paidThisMonth,
            status: bill ? bill.status : 'NOT_GENERATED',
        };
    });
}
