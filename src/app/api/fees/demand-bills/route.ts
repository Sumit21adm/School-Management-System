
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        const month = searchParams.get('month');
        const year = searchParams.get('year');
        const status = searchParams.get('status');
        const studentId = searchParams.get('studentId');
        const className = searchParams.get('class'); // 'className' might be reserved? using 'class' as param
        const section = searchParams.get('section');
        const search = searchParams.get('search');

        const where: any = {};

        if (sessionId) where.sessionId = parseInt(sessionId);
        if (month) where.month = parseInt(month);
        if (year) where.year = parseInt(year);
        if (status) where.status = status;
        if (studentId) where.studentId = studentId;

        // Class/Section filtering requires joining with Student
        if (className || section || search) {
            where.student = {};
            if (className) where.student.className = className;
            if (section) where.student.section = section;
            if (search) {
                where.student.OR = [
                    { name: { contains: search } },
                    { studentId: { contains: search } }
                ];
            }
        }

        const bills = await prisma.demandBill.findMany({
            where,
            include: {
                student: {
                    select: { name: true, className: true, section: true, fatherName: true }
                }
            },
            orderBy: {
                billDate: 'desc'
            }
        });

        // Calculate summary
        const summary = {
            totalAmount: bills.reduce((sum, b) => sum + Number(b.netAmount), 0),
            collectedAmount: bills.reduce((sum, b) => sum + Number(b.paidAmount), 0),
            pendingAmount: bills.reduce((sum, b) => sum + (Number(b.netAmount) - Number(b.paidAmount)), 0),
            count: bills.length
        };

        return NextResponse.json({
            bills,
            summary
        });
    } catch (error) {
        console.error('Error fetching demand bills:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
