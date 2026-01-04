import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET dashboard stats
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sessionIdParam = searchParams.get('sessionId');
        console.log('[API] Dashboard Request:', { sessionIdParam });

        // Determine target session
        let targetSessionId;
        let targetSessionName;

        if (sessionIdParam) {
            const requestedSession = await prisma.academicSession.findUnique({
                where: { id: parseInt(sessionIdParam) }
            });
            if (requestedSession) {
                targetSessionId = requestedSession.id;
                targetSessionName = requestedSession.name;
            }
        }

        // Fallback to active session
        if (!targetSessionId) {
            const activeSession = await prisma.academicSession.findFirst({
                where: { isActive: true },
            });
            if (activeSession) {
                targetSessionId = activeSession.id;
                targetSessionName = activeSession.name;
            }
        }

        if (!targetSessionId) {
            return NextResponse.json({
                totalStudents: 0,
                totalClasses: 0,
                totalCollections: 0,
                pendingFees: 0,
                recentAdmissions: [],
                recentCollections: [],
            });
        }

        // Get stats in parallel using targetSessionId
        const [
            totalStudents,
            totalClasses,
            totalCollections,
            pendingBills,
            recentAdmissions,
            recentCollections,
            studentsByClass,
        ] = await Promise.all([
            prisma.studentDetails.count({
                where: { status: 'active' }, // Total students usually independent of session unless strict history
            }),
            prisma.schoolClass.count({
                where: { isActive: true },
            }),
            prisma.feeTransaction.aggregate({
                where: { sessionId: targetSessionId },
                _sum: { amount: true },
            }),
            prisma.demandBill.aggregate({
                where: {
                    sessionId: targetSessionId,
                    status: { in: ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'] },
                },
                _sum: { netAmount: true },
            }),
            prisma.studentDetails.findMany({
                where: { status: 'active' },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    studentId: true,
                    name: true,
                    className: true,
                    section: true,
                    admissionDate: true,
                    createdAt: true,
                },
            }),
            prisma.feeTransaction.findMany({
                where: { sessionId: targetSessionId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    student: {
                        select: { name: true, className: true },
                    },
                },
            }),
            prisma.studentDetails.groupBy({
                by: ['className'],
                where: { status: 'active' },
                _count: { id: true },
            }),
        ]);

        return NextResponse.json({
            totalStudents,
            totalClasses,
            totalCollections: Number(totalCollections._sum.amount) || 0,
            pendingFees: Number(pendingBills._sum.netAmount) || 0,
            recentAdmissions,
            recentCollections,
            studentsByClass,
            activeSession: targetSessionName,
        });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
    }
}
