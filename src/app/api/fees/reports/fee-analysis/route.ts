import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/fees/reports/fee-analysis
 * 
 * Returns fee collection analysis by fee type
 * Query params: sessionId (required), className (optional)
 */
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        const className = searchParams.get('className');

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
        }

        // Get all fee types
        const feeTypes = await prisma.feeType.findMany({
            orderBy: { name: 'asc' }
        });

        // Build where clause for bills and transactions
        const billWhere: any = { sessionId: parseInt(sessionId) };
        const txnWhere: any = { sessionId: parseInt(sessionId) };

        if (className) {
            billWhere.student = { className };
            txnWhere.student = { className };
        }

        // Get all bill items (demanded amounts)
        const billItems = await prisma.demandBillItem.findMany({
            where: {
                bill: billWhere
            },
            include: {
                feeType: true,
                bill: {
                    select: {
                        status: true,
                        student: { select: { className: true } }
                    }
                }
            }
        });

        // Get all payment details (collected amounts)
        const paymentDetails = await prisma.feePaymentDetail.findMany({
            where: {
                transaction: txnWhere
            },
            include: {
                feeType: true,
                transaction: {
                    select: {
                        student: { select: { className: true } }
                    }
                }
            }
        });

        // Build analysis by fee type
        const feeTypeAnalysis = feeTypes.map(feeType => {
            // Calculate demanded (from bills)
            const demandedItems = billItems.filter(item => item.feeTypeId === feeType.id);
            const totalDemanded = demandedItems.reduce((sum, item) =>
                sum + Number(item.amount), 0
            );
            const totalDiscount = demandedItems.reduce((sum, item) =>
                sum + Number(item.discountAmount), 0
            );

            // Calculate collected (from payments)
            const collectedItems = paymentDetails.filter(pd => pd.feeTypeId === feeType.id);
            const totalCollected = collectedItems.reduce((sum, pd) =>
                sum + Number(pd.netAmount), 0
            );

            // Calculate pending
            const netDemanded = totalDemanded - totalDiscount;
            const pending = netDemanded - totalCollected;
            const collectionRate = netDemanded > 0
                ? Math.round((totalCollected / netDemanded) * 100)
                : 0;

            // Count unique students
            const demandedStudents = new Set(demandedItems.map(item =>
                item.bill.student?.className
            )).size;
            const collectedStudents = new Set(collectedItems.map(pd =>
                pd.transaction.student?.className
            )).size;

            return {
                feeTypeId: feeType.id,
                feeType: feeType.name,
                frequency: feeType.frequency,
                totalDemanded,
                totalDiscount,
                netDemanded,
                totalCollected,
                pending: pending > 0 ? pending : 0,
                collectionRate,
                billCount: demandedItems.length,
                paymentCount: collectedItems.length
            };
        }).filter(ft => ft.totalDemanded > 0 || ft.totalCollected > 0);

        // Calculate summary
        const summary = {
            totalDemanded: feeTypeAnalysis.reduce((sum, ft) => sum + ft.totalDemanded, 0),
            totalDiscount: feeTypeAnalysis.reduce((sum, ft) => sum + ft.totalDiscount, 0),
            totalCollected: feeTypeAnalysis.reduce((sum, ft) => sum + ft.totalCollected, 0),
            totalPending: feeTypeAnalysis.reduce((sum, ft) => sum + ft.pending, 0),
            overallCollectionRate: 0
        };

        const netDemanded = summary.totalDemanded - summary.totalDiscount;
        summary.overallCollectionRate = netDemanded > 0
            ? Math.round((summary.totalCollected / netDemanded) * 100)
            : 0;

        return NextResponse.json({
            sessionId: parseInt(sessionId),
            className: className || 'All Classes',
            generatedAt: new Date().toISOString(),
            summary,
            feeTypes: feeTypeAnalysis
        });

    } catch (error) {
        console.error('Error generating fee analysis:', error);
        return NextResponse.json({ error: 'Failed to generate fee analysis' }, { status: 500 });
    }
}
