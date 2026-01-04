import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET preview promotion candidates
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const currentSessionId = parseInt(searchParams.get('currentSessionId') || '0');
        const className = searchParams.get('className');
        const section = searchParams.get('section');

        if (!currentSessionId || !className) {
            return NextResponse.json({ error: 'currentSessionId and className are required' }, { status: 400 });
        }

        const where: any = {
            sessionId: currentSessionId,
            className,
            status: { not: 'passed' }, // Exclude already passed students
        };

        if (section) {
            where.section = section;
        }

        const students = await prisma.studentDetails.findMany({
            where,
            orderBy: { studentId: 'asc' },
            select: {
                id: true,
                studentId: true,
                name: true,
                fatherName: true,
                className: true,
                section: true,
                status: true,
            },
        });

        const eligible = students.filter((s) => s.status === 'active');
        const nextClass = await calculateNextClass(className);
        const isPassoutClass = ['10', '12'].includes(className);

        return NextResponse.json({
            students,
            meta: {
                total: students.length,
                eligible: eligible.length,
                ineligible: students.length - eligible.length,
                currentClass: className,
                nextClass,
                isPassoutClass,
            },
        });
    } catch (error) {
        console.error('Error previewing promotion:', error);
        return NextResponse.json({ error: 'Failed to preview promotion' }, { status: 500 });
    }
}

// POST execute promotion
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { studentIds, currentSessionId, nextSessionId, nextClass, nextSection, markAsPassout } = body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json({ error: 'studentIds array is required' }, { status: 400 });
        }

        if (!markAsPassout && (!nextSessionId || !nextClass)) {
            return NextResponse.json({ error: 'nextSessionId and nextClass are required for promotion' }, { status: 400 });
        }

        const results = {
            success: true,
            promoted: 0,
            failed: 0,
            errors: [] as { studentId: number; reason: string }[],
        };

        for (const studentId of studentIds) {
            try {
                if (markAsPassout) {
                    // Mark student as passed out
                    await prisma.studentDetails.update({
                        where: { id: studentId },
                        data: { status: 'passed' },
                    });
                } else {
                    // 1. Fetch current student details
                    const student = await prisma.studentDetails.findUnique({
                        where: { id: studentId },
                    });

                    if (!student) {
                        throw new Error(`Student not found: ${studentId}`);
                    }

                    // 2. Save current details to history
                    await prisma.studentAcademicHistory.create({
                        data: {
                            studentId: student.studentId, // Use the string ID for history
                            sessionId: student.sessionId!,
                            className: student.className,
                            section: student.section,
                            status: 'promoted',
                        },
                    });

                    // 3. Promote to next class/session
                    await prisma.studentDetails.update({
                        where: { id: studentId },
                        data: {
                            className: nextClass,
                            section: nextSection || student.section,
                            sessionId: nextSessionId,
                        },
                    });
                }
                results.promoted++;
            } catch (error: any) {
                results.failed++;
                results.errors.push({
                    studentId,
                    reason: error.message || 'Unknown error',
                });
            }
        }

        if (results.failed > 0) {
            results.success = false;
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error executing promotion:', error);
        return NextResponse.json({ error: 'Failed to execute promotion' }, { status: 500 });
    }
}

// Helper function to calculate next class
async function calculateNextClass(currentClass: string): Promise<string | null> {
    const currentParams = await prisma.schoolClass.findUnique({
        where: { name: currentClass },
    });

    if (!currentParams) return null;

    const nextClass = await prisma.schoolClass.findFirst({
        where: {
            order: {
                gt: currentParams.order,
            },
        },
        orderBy: {
            order: 'asc',
        },
    });

    return nextClass ? nextClass.name : null;
}
