import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single exam
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const examId = parseInt(id);

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                examType: true,
                session: true,
                schedules: {
                    include: { subject: true },
                    orderBy: { date: 'asc' },
                },
            },
        });

        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        return NextResponse.json(exam);
    } catch (error) {
        console.error('Error fetching exam:', error);
        return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 });
    }
}

// PUT update exam
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const examId = parseInt(id);

        const body = await request.json();
        const { name, examTypeId, startDate, endDate, description, status } = body;

        const exam = await prisma.exam.update({
            where: { id: examId },
            data: {
                ...(name && { name }),
                ...(examTypeId && { examTypeId }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate && { endDate: new Date(endDate) }),
                ...(description !== undefined && { description }),
                ...(status && { status }),
            },
            include: {
                examType: true,
                session: true,
                schedules: { include: { subject: true } },
            },
        });

        return NextResponse.json(exam);
    } catch (error) {
        console.error('Error updating exam:', error);
        return NextResponse.json({ error: 'Failed to update exam' }, { status: 500 });
    }
}

// DELETE exam
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const examId = parseInt(id);

        await prisma.exam.delete({ where: { id: examId } });

        return NextResponse.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        console.error('Error deleting exam:', error);
        return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 });
    }
}
