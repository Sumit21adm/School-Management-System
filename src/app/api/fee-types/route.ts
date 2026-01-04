import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET all fee types
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const feeTypes = await prisma.feeType.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(feeTypes);
    } catch (error) {
        console.error('Error fetching fee types:', error);
        return NextResponse.json({ error: 'Failed to fetch fee types' }, { status: 500 });
    }
}

// POST create new fee type
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, isRecurring, frequency } = body;

        const feeType = await prisma.feeType.create({
            data: {
                name,
                description,
                isRecurring: isRecurring || false,
                frequency,
            },
        });

        return NextResponse.json(feeType, { status: 201 });
    } catch (error) {
        console.error('Error creating fee type:', error);
        return NextResponse.json({ error: 'Failed to create fee type' }, { status: 500 });
    }
}
