import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET all exams
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        const status = searchParams.get('status');

        const where: any = {};
        if (sessionId) where.sessionId = parseInt(sessionId);
        if (status) where.status = status;

        const exams = await prisma.exam.findMany({
            where,
            include: {
                examType: true,
                session: { select: { name: true } },
                schedules: {
                    include: { subject: true },
                },
            },
            orderBy: { startDate: 'desc' },
        });

        return NextResponse.json(exams);
    } catch (error) {
        console.error('Error fetching exams:', error);
        return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
    }
}

// POST create new exam
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, examTypeId, sessionId, startDate, endDate, description, schedules } = body;

        if (!name || !examTypeId || !sessionId || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const exam = await prisma.exam.create({
            data: {
                name,
                examTypeId,
                sessionId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                description,
                status: 'UPCOMING',
                schedules: schedules ? {
                    create: schedules.map((s: any) => ({
                        subjectId: s.subjectId,
                        className: s.className,
                        date: new Date(s.date),
                        startTime: new Date(`1970-01-01T${s.startTime}`),
                        endTime: new Date(`1970-01-01T${s.endTime}`),
                        roomNo: s.roomNo,
                    })),
                } : undefined,
            },
            include: {
                examType: true,
                session: true,
                schedules: { include: { subject: true } },
            },
        });

        return NextResponse.json(exam, { status: 201 });
    } catch (error) {
        console.error('Error creating exam:', error);
        return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
    }
}
