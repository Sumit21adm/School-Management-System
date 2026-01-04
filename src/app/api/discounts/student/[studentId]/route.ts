import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET discounts for a specific student
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { studentId } = await params;
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        const where: any = { studentId };
        if (sessionId) {
            where.sessionId = parseInt(sessionId);
        }

        const discounts = await prisma.studentFeeDiscount.findMany({
            where,
            include: {
                feeType: true,
                session: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(
            discounts.map(d => ({
                ...d,
                discountValue: Number(d.discountValue),
            }))
        );
    } catch (error) {
        console.error('Error fetching student discounts:', error);
        return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
    }
}
