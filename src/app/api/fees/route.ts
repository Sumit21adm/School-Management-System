import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET fee transactions with filters
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const sessionId = searchParams.get('sessionId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = searchParams.get('limit');

        const where: any = {};
        if (studentId) where.studentId = studentId;
        if (sessionId) where.sessionId = parseInt(sessionId);
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const transactions = await prisma.feeTransaction.findMany({
            where,
            include: {
                student: {
                    select: { name: true, className: true, section: true },
                },
                paymentDetails: {
                    include: { feeType: true },
                },
            },
            orderBy: { date: 'desc' },
            ...(limit && { take: parseInt(limit) }),
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

// POST create fee transaction (collect fee)
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { studentId, sessionId, amount, paymentMode, remarks, feeDetails, collectedBy, billNo } = body;

        if (!studentId || !sessionId || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate transaction ID and receipt number
        const timestamp = Date.now();
        const transactionId = `TXN${timestamp}`;
        const receiptNo = `RCP${timestamp}`;

        // Use transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Create transaction
            const transaction = await tx.feeTransaction.create({
                data: {
                    transactionId,
                    receiptNo,
                    studentId,
                    sessionId,
                    amount,
                    description: feeDetails?.map((f: any) => f.name || 'Fee').join(', ') || 'Fee Payment',
                    paymentMode,
                    date: new Date(),
                    yearId: new Date().getFullYear(),
                    remarks,
                    collectedBy: collectedBy || session.user?.name || 'Admin',
                    paymentDetails: feeDetails ? {
                        create: feeDetails.map((f: any) => ({
                            feeTypeId: f.feeTypeId,
                            amount: f.amount,
                            discountAmount: f.discountAmount || 0,
                            netAmount: f.netAmount || f.amount - (f.discountAmount || 0),
                        })),
                    } : undefined,
                },
                include: {
                    student: { select: { name: true, className: true } },
                    paymentDetails: { include: { feeType: true } },
                },
            });

            // If billNo provided, update the demand bill
            if (billNo) {
                const bill = await tx.demandBill.findUnique({ where: { billNo } });
                if (bill) {
                    const newPaidAmount = Number(bill.paidAmount) + Number(amount);
                    const netAmount = Number(bill.netAmount);

                    // Determine new status
                    let newStatus = 'PENDING';
                    if (newPaidAmount >= netAmount) {
                        newStatus = 'PAID';
                    } else if (newPaidAmount > 0) {
                        newStatus = 'PARTIALLY_PAID';
                    }

                    await tx.demandBill.update({
                        where: { billNo },
                        data: {
                            paidAmount: newPaidAmount,
                            status: newStatus as 'PENDING' | 'PARTIALLY_PAID' | 'PAID',
                        },
                    });
                }
            }

            return transaction;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}

