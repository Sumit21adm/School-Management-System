import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single fee type
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const feeTypeId = parseInt(id);

        if (isNaN(feeTypeId)) {
            return NextResponse.json({ error: 'Invalid fee type ID' }, { status: 400 });
        }

        const feeType = await prisma.feeType.findUnique({
            where: { id: feeTypeId },
        });

        if (!feeType) {
            return NextResponse.json({ error: 'Fee type not found' }, { status: 404 });
        }

        return NextResponse.json(feeType);
    } catch (error) {
        console.error('Error fetching fee type:', error);
        return NextResponse.json({ error: 'Failed to fetch fee type' }, { status: 500 });
    }
}

// PUT update fee type
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const feeTypeId = parseInt(id);

        if (isNaN(feeTypeId)) {
            return NextResponse.json({ error: 'Invalid fee type ID' }, { status: 400 });
        }

        const existing = await prisma.feeType.findUnique({
            where: { id: feeTypeId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Fee type not found' }, { status: 404 });
        }

        const body = await request.json();
        const { name, description, isActive } = body;

        // Check if deactivating and used in fee structures
        if (isActive === false) {
            const usageCount = await prisma.feeStructureItem.count({
                where: { feeTypeId },
            });
            if (usageCount > 0) {
                return NextResponse.json({
                    error: `Cannot deactivate fee type used in ${usageCount} fee structures`
                }, { status: 400 });
            }
        }

        const updated = await prisma.feeType.update({
            where: { id: feeTypeId },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating fee type:', error);
        return NextResponse.json({ error: 'Failed to update fee type' }, { status: 500 });
    }
}

// DELETE fee type (with safety checks)
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const feeTypeId = parseInt(id);

        if (isNaN(feeTypeId)) {
            return NextResponse.json({ error: 'Invalid fee type ID' }, { status: 400 });
        }

        const feeType = await prisma.feeType.findUnique({
            where: { id: feeTypeId },
        });

        if (!feeType) {
            return NextResponse.json({ error: 'Fee type not found' }, { status: 404 });
        }

        // Cannot delete default fee types
        if (feeType.isDefault) {
            return NextResponse.json({ error: 'Cannot delete default fee types' }, { status: 400 });
        }

        // Check if used in fee structures
        const usageCount = await prisma.feeStructureItem.count({
            where: { feeTypeId },
        });

        if (usageCount > 0) {
            return NextResponse.json({
                error: `Cannot delete fee type used in ${usageCount} fee structures`
            }, { status: 400 });
        }

        await prisma.feeType.delete({ where: { id: feeTypeId } });

        return NextResponse.json({ message: 'Fee type deleted successfully' });
    } catch (error) {
        console.error('Error deleting fee type:', error);
        return NextResponse.json({ error: 'Failed to delete fee type' }, { status: 500 });
    }
}
