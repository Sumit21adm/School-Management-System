import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET fee structure for a class
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const className = searchParams.get('className');
        const sessionId = searchParams.get('sessionId');

        const where: any = {};
        if (className) where.className = className;
        if (sessionId) where.sessionId = parseInt(sessionId);

        const structures = await prisma.feeStructure.findMany({
            where,
            include: {
                session: true,
                feeItems: {
                    include: { feeType: true },
                },
            },
        });

        return NextResponse.json(structures);
    } catch (error) {
        console.error('Error fetching fee structures:', error);
        return NextResponse.json({ error: 'Failed to fetch fee structures' }, { status: 500 });
    }
}

// POST create/update fee structure
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { sessionId, className, feeItems } = body;

        // Upsert fee structure
        const structure = await prisma.feeStructure.upsert({
            where: {
                sessionId_className: { sessionId, className },
            },
            update: {},
            create: {
                sessionId,
                className,
            },
        });

        // Delete existing items and create new ones
        await prisma.feeStructureItem.deleteMany({
            where: { structureId: structure.id },
        });

        if (feeItems && feeItems.length > 0) {
            await prisma.feeStructureItem.createMany({
                data: feeItems.map((item: any) => ({
                    structureId: structure.id,
                    feeTypeId: item.feeTypeId,
                    amount: item.amount,
                    isOptional: item.isOptional || false,
                    frequency: item.frequency,
                })),
            });
        }

        // Fetch updated structure with items
        const result = await prisma.feeStructure.findUnique({
            where: { id: structure.id },
            include: {
                feeItems: { include: { feeType: true } },
            },
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error creating fee structure:', error);
        return NextResponse.json({ error: 'Failed to create fee structure' }, { status: 500 });
    }
}
