import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/fees/reports/outstanding
 * 
 * Returns class-wise outstanding dues report
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

        // Get all demand bills with student info for this session
        const bills = await prisma.demandBill.findMany({
            where: {
                sessionId: parseInt(sessionId),
                status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] }
            },
            include: {
                student: {
                    select: {
                        studentId: true,
                        name: true,
                        fatherName: true,
                        className: true,
                        section: true,
                        phone: true,
                    }
                },
                billItems: {
                    include: {
                        feeType: { select: { name: true } }
                    }
                }
            },
            orderBy: [
                { student: { className: 'asc' } },
                { student: { section: 'asc' } },
                { student: { name: 'asc' } }
            ]
        });

        // Calculate outstanding per student and group by class
        const classMap = new Map<string, {
            className: string;
            totalOutstanding: number;
            studentCount: number;
            students: Array<{
                studentId: string;
                name: string;
                fatherName: string;
                section: string;
                mobile: string | null;
                totalBilled: number;
                totalPaid: number;
                outstanding: number;
                bills: Array<{
                    billNo: string;
                    month: number;
                    year: number;
                    amount: number;
                    paid: number;
                    balance: number;
                    status: string;
                }>;
            }>;
        }>();

        // Process bills and group by student, then by class
        const studentMap = new Map<string, {
            student: typeof bills[0]['student'];
            bills: typeof bills;
        }>();

        bills.forEach(bill => {
            const existing = studentMap.get(bill.studentId);
            if (existing) {
                existing.bills.push(bill);
            } else {
                studentMap.set(bill.studentId, {
                    student: bill.student,
                    bills: [bill]
                });
            }
        });

        // Now build class-wise summary
        studentMap.forEach(({ student, bills: studentBills }) => {
            const className = student.className;

            let totalBilled = 0;
            let totalPaid = 0;
            const billDetails = studentBills.map(bill => {
                const billed = Number(bill.netAmount);
                const paid = Number(bill.paidAmount);
                totalBilled += billed;
                totalPaid += paid;

                return {
                    billNo: bill.billNo,
                    month: bill.month,
                    year: bill.year,
                    amount: billed,
                    paid: paid,
                    balance: billed - paid,
                    status: bill.status
                };
            });

            const outstanding = totalBilled - totalPaid;

            if (outstanding <= 0) return; // Skip if fully paid

            const studentData = {
                studentId: student.studentId,
                name: student.name,
                fatherName: student.fatherName || '',
                section: student.section,
                mobile: student.phone,
                totalBilled,
                totalPaid,
                outstanding,
                bills: billDetails
            };

            const classEntry = classMap.get(className);
            if (classEntry) {
                classEntry.students.push(studentData);
                classEntry.totalOutstanding += outstanding;
                classEntry.studentCount++;
            } else {
                classMap.set(className, {
                    className,
                    totalOutstanding: outstanding,
                    studentCount: 1,
                    students: [studentData]
                });
            }
        });

        // Convert to sorted array
        const classReport = Array.from(classMap.values())
            .sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true }));

        // Calculate grand totals
        const grandTotal = classReport.reduce((sum, c) => sum + c.totalOutstanding, 0);
        const totalStudents = classReport.reduce((sum, c) => sum + c.studentCount, 0);

        return NextResponse.json({
            sessionId: parseInt(sessionId),
            generatedAt: new Date().toISOString(),
            summary: {
                totalClasses: classReport.length,
                totalStudents,
                grandTotal
            },
            classes: classReport
        });

    } catch (error) {
        console.error('Error generating outstanding report:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
