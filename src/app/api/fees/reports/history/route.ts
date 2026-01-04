import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/fees/reports/history
 * 
 * Returns bill generation history grouped by batch (timestamp)
 * Ported from legacy fees.service.ts getBillGenerationHistory()
 * Query params: sessionId (required)
 */
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
        }

        // Get all bills with student info for this session
        const bills = await prisma.demandBill.findMany({
            where: { sessionId: parseInt(sessionId) },
            include: {
                student: {
                    select: {
                        studentId: true,
                        name: true,
                        className: true,
                        section: true,
                    },
                },
                billItems: {
                    include: {
                        feeType: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Group bills by timestamp (rounded to nearest minute for batch detection)
        const batches = new Map<string, {
            timestamp: Date;
            bills: typeof bills;
            classes: Set<string>;
            sections: Set<string>;
            feeTypes: Set<string>;
        }>();

        bills.forEach(bill => {
            // Round to nearest minute for grouping
            const roundedTime = new Date(bill.createdAt);
            roundedTime.setSeconds(0, 0);
            const key = roundedTime.toISOString();

            if (!batches.has(key)) {
                batches.set(key, {
                    timestamp: roundedTime,
                    bills: [],
                    classes: new Set(),
                    sections: new Set(),
                    feeTypes: new Set(),
                });
            }

            const batch = batches.get(key)!;
            batch.bills.push(bill);
            batch.classes.add(bill.student.className);
            batch.sections.add(bill.student.section);
            bill.billItems.forEach(item => batch.feeTypes.add(item.feeType.name));
        });

        // Convert to array format
        const history = Array.from(batches.values()).map(batch => {
            // Determine bill type based on unique classes
            let billType = 'Single Student';
            if (batch.bills.length > 1) {
                if (batch.classes.size === 1 && batch.sections.size === 1) {
                    billType = 'Entire Section';
                } else if (batch.classes.size === 1) {
                    billType = 'Entire Class';
                } else {
                    billType = 'Multiple Classes';
                }
            }

            return {
                timestamp: batch.timestamp,
                billType,
                month: batch.bills[0].month,
                year: batch.bills[0].year,
                classes: Array.from(batch.classes).sort((a, b) =>
                    a.localeCompare(b, undefined, { numeric: true })
                ),
                sections: Array.from(batch.sections).sort(),
                feeTypes: Array.from(batch.feeTypes),
                studentCount: batch.bills.length,
                totalAmount: batch.bills.reduce((sum, b) => sum + Number(b.totalAmount), 0),
                bills: batch.bills.map(b => ({
                    billNo: b.billNo,
                    studentId: b.student.studentId,
                    studentName: b.student.name,
                    className: b.student.className,
                    section: b.student.section,
                    amount: Number(b.totalAmount),
                    netAmount: Number(b.netAmount),
                    status: b.status,
                })),
            };
        });

        return NextResponse.json({
            sessionId: parseInt(sessionId),
            generatedAt: new Date().toISOString(),
            totalBatches: history.length,
            totalBills: bills.length,
            history
        });

    } catch (error) {
        console.error('Error fetching bill history:', error);
        return NextResponse.json({ error: 'Failed to fetch bill history' }, { status: 500 });
    }
}
