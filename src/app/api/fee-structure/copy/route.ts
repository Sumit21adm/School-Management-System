import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';

// POST copy fee structure from one session to another
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { sourceSessionId, targetSessionId, classes, applyPercentageIncrease } = body;

        if (!sourceSessionId || !targetSessionId) {
            return NextResponse.json({
                error: 'sourceSessionId and targetSessionId are required'
            }, { status: 400 });
        }

        if (sourceSessionId === targetSessionId) {
            return NextResponse.json({
                error: 'Source and target sessions must be different'
            }, { status: 400 });
        }

        // Verify sessions exist
        const [sourceSession, targetSession] = await Promise.all([
            prisma.academicSession.findUnique({ where: { id: sourceSessionId } }),
            prisma.academicSession.findUnique({ where: { id: targetSessionId } }),
        ]);

        if (!sourceSession) {
            return NextResponse.json({ error: 'Source session not found' }, { status: 404 });
        }
        if (!targetSession) {
            return NextResponse.json({ error: 'Target session not found' }, { status: 404 });
        }

        // Get all class names from database or use provided list
        let classesToCopy: string[];
        if (classes && classes.length > 0) {
            classesToCopy = classes;
        } else {
            // Get all classes from SchoolClass table
            const allClasses = await prisma.schoolClass.findMany({
                where: { isActive: true },
                orderBy: { order: 'asc' },
            });
            classesToCopy = allClasses.map(c => c.name);
        }

        let copiedCount = 0;
        const copiedClasses: string[] = [];

        for (const className of classesToCopy) {
            const sourceStructure = await prisma.feeStructure.findUnique({
                where: {
                    sessionId_className: { sessionId: sourceSessionId, className },
                },
                include: {
                    feeItems: true,
                },
            });

            if (sourceStructure) {
                // Delete existing target structure if exists
                await prisma.feeStructure.deleteMany({
                    where: { sessionId: targetSessionId, className },
                });

                // Create new structure with optional percentage increase
                await prisma.feeStructure.create({
                    data: {
                        sessionId: targetSessionId,
                        className,
                        description: sourceStructure.description,
                        feeItems: {
                            create: sourceStructure.feeItems.map(item => {
                                let amount = Number(item.amount);
                                if (applyPercentageIncrease && applyPercentageIncrease > 0) {
                                    amount = amount * (1 + applyPercentageIncrease / 100);
                                }
                                return {
                                    feeTypeId: item.feeTypeId,
                                    amount: new Decimal(amount.toFixed(2)),
                                    isOptional: item.isOptional,
                                    frequency: item.frequency,
                                };
                            }),
                        },
                    },
                });

                copiedCount++;
                copiedClasses.push(className);
            }
        }

        return NextResponse.json({
            message: 'Fee structures copied successfully',
            copiedCount,
            classes: copiedClasses,
            sourceSession: sourceSession.name,
            targetSession: targetSession.name,
            percentageIncrease: applyPercentageIncrease || 0,
        });
    } catch (error) {
        console.error('Error copying fee structure:', error);
        return NextResponse.json({ error: 'Failed to copy fee structure' }, { status: 500 });
    }
}
