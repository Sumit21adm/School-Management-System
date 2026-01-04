import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET all exam types
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const examTypes = await prisma.examType.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(examTypes);
    } catch (error) {
        console.error('Error fetching exam types:', error);
        return NextResponse.json({ error: 'Failed to fetch exam types' }, { status: 500 });
    }
}

// POST create exam type
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const examType = await prisma.examType.create({
            data: { name, description },
        });

        return NextResponse.json(examType, { status: 201 });
    } catch (error) {
        console.error('Error creating exam type:', error);
        return NextResponse.json({ error: 'Failed to create exam type' }, { status: 500 });
    }
}
