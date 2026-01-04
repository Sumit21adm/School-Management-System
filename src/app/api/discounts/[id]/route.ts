import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single discount
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const discountId = parseInt(id);

        if (isNaN(discountId)) {
            return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 });
        }

        const discount = await prisma.studentFeeDiscount.findUnique({
            where: { id: discountId },
            include: {
                student: { select: { name: true, className: true } },
                feeType: true,
                session: true,
            },
        });

        if (!discount) {
            return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...discount,
            discountValue: Number(discount.discountValue),
        });
    } catch (error) {
        console.error('Error fetching discount:', error);
        return NextResponse.json({ error: 'Failed to fetch discount' }, { status: 500 });
    }
}

// PUT update discount
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const discountId = parseInt(id);

        if (isNaN(discountId)) {
            return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 });
        }

        const existing = await prisma.studentFeeDiscount.findUnique({
            where: { id: discountId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
        }

        const body = await request.json();
        const { discountType, discountValue, reason, approvedBy } = body;

        // Validate percentage if updating
        if (discountType === 'PERCENTAGE' && discountValue && discountValue > 100) {
            return NextResponse.json({ error: 'Percentage discount cannot exceed 100%' }, { status: 400 });
        }

        const updated = await prisma.studentFeeDiscount.update({
            where: { id: discountId },
            data: {
                ...(discountType !== undefined && { discountType }),
                ...(discountValue !== undefined && { discountValue: new Decimal(discountValue) }),
                ...(reason !== undefined && { reason }),
                ...(approvedBy !== undefined && { approvedBy }),
            },
            include: {
                feeType: true,
                session: true,
            },
        });

        return NextResponse.json({
            ...updated,
            discountValue: Number(updated.discountValue),
        });
    } catch (error) {
        console.error('Error updating discount:', error);
        return NextResponse.json({ error: 'Failed to update discount' }, { status: 500 });
    }
}

// DELETE discount
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const discountId = parseInt(id);

        if (isNaN(discountId)) {
            return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 });
        }

        const discount = await prisma.studentFeeDiscount.findUnique({
            where: { id: discountId },
        });

        if (!discount) {
            return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
        }

        await prisma.studentFeeDiscount.delete({ where: { id: discountId } });

        return NextResponse.json({ message: 'Discount deleted successfully' });
    } catch (error) {
        console.error('Error deleting discount:', error);
        return NextResponse.json({ error: 'Failed to delete discount' }, { status: 500 });
    }
}
