import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/fee-structure/class-fees
 * 
 * Get configured fee types with amounts for a specific class and session.
 * This is used by Demand Bills and Fee Collection to show only configured fee types.
 * 
 * Query params:
 * - className: Required - The class name
 * - sessionId: Required - The academic session ID
 */
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const className = searchParams.get('className');
        const sessionId = searchParams.get('sessionId');

        if (!className || !sessionId) {
            return NextResponse.json(
                { error: 'className and sessionId are required' },
                { status: 400 }
            );
        }

        // Find fee structure for this class and session
        const feeStructure = await prisma.feeStructure.findUnique({
            where: {
                sessionId_className: {
                    sessionId: parseInt(sessionId),
                    className: className
                }
            },
            include: {
                feeItems: {
                    include: {
                        feeType: true
                    },
                    orderBy: {
                        feeType: {
                            name: 'asc'
                        }
                    }
                }
            }
        });

        if (!feeStructure) {
            return NextResponse.json({
                configured: false,
                className,
                sessionId: parseInt(sessionId),
                feeTypes: [],
                message: 'No fee structure configured for this class'
            });
        }

        // Transform to a cleaner response
        const feeTypes = feeStructure.feeItems.map(item => ({
            id: item.feeType.id,
            name: item.feeType.name,
            amount: Number(item.amount),
            frequency: item.frequency || item.feeType.frequency,
            isOptional: item.isOptional,
            isRecurring: item.feeType.isRecurring
        }));

        return NextResponse.json({
            configured: true,
            className,
            sessionId: parseInt(sessionId),
            structureId: feeStructure.id,
            feeTypes,
            totalMonthly: feeTypes
                .filter(ft => ft.frequency === 'Monthly')
                .reduce((sum, ft) => sum + ft.amount, 0),
            totalYearly: feeTypes
                .filter(ft => ft.frequency === 'Yearly' || ft.frequency === 'One-time')
                .reduce((sum, ft) => sum + ft.amount, 0)
        });

    } catch (error) {
        console.error('Error fetching class fee structure:', error);
        return NextResponse.json(
            { error: 'Failed to fetch fee structure' },
            { status: 500 }
        );
    }
}
