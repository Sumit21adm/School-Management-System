import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ receiptNo: string }>;
}

// GET receipt details
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { receiptNo } = await params;

        const transaction = await prisma.feeTransaction.findUnique({
            where: { receiptNo },
            include: {
                student: {
                    select: {
                        studentId: true,
                        name: true,
                        fatherName: true,
                        className: true,
                        section: true,
                        phone: true,
                    },
                },
                session: {
                    select: { name: true },
                },
                paymentDetails: {
                    include: { feeType: true },
                },
            },
        });

        if (!transaction) {
            return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
        }

        // Get print settings for header
        const printSettings = await prisma.printSettings.findFirst();

        return NextResponse.json({
            receipt: {
                receiptNo: transaction.receiptNo,
                transactionId: transaction.transactionId,
                date: transaction.date,
                amount: Number(transaction.amount),
                paymentMode: transaction.paymentMode,
                remarks: transaction.remarks,
                collectedBy: transaction.collectedBy,
            },
            student: transaction.student,
            session: transaction.session,
            paymentDetails: transaction.paymentDetails.map(pd => ({
                feeTypeName: pd.feeType.name,
                amount: Number(pd.amount),
                discountAmount: Number(pd.discountAmount),
                netAmount: Number(pd.netAmount),
            })),
            school: printSettings ? {
                name: printSettings.schoolName,
                address: printSettings.schoolAddress,
                phone: printSettings.phone,
                email: printSettings.email,
                logoUrl: printSettings.logoUrl,
                feeReceiptNote: printSettings.feeReceiptNote,
            } : null,
        });
    } catch (error) {
        console.error('Error fetching receipt:', error);
        return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 });
    }
}
