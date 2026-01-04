import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET student discounts
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const sessionId = searchParams.get('sessionId');

        const where: any = {};
        if (studentId) where.studentId = studentId;
        if (sessionId) where.sessionId = parseInt(sessionId);

        const discounts = await prisma.studentFeeDiscount.findMany({
            where,
            include: {
                student: { select: { name: true, className: true } },
                feeType: true,
                session: true,
            },
        });

        return NextResponse.json(discounts);
    } catch (error) {
        console.error('Error fetching discounts:', error);
        return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
    }
}

// POST create discount
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { studentId, feeTypeId, sessionId, discountType, discountValue, reason } = body;

        const discount = await prisma.studentFeeDiscount.upsert({
            where: {
                studentId_feeTypeId_sessionId: { studentId, feeTypeId, sessionId },
            },
            update: {
                discountType,
                discountValue,
                reason,
                approvedBy: session.user.name,
            },
            create: {
                studentId,
                feeTypeId,
                sessionId,
                discountType,
                discountValue,
                reason,
                approvedBy: session.user.name,
            },
        });

        return NextResponse.json(discount, { status: 201 });
    } catch (error) {
        console.error('Error creating discount:', error);
        return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
    }
}
