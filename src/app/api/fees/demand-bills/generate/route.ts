
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await request.json();
        const {
            sessionId,
            month,
            year,
            dueDate,
            selectedFeeTypeIds,
            studentId, // Optional: for single Student
            className, // Optional: for class
            section,   // Optional: for section
            autoCalculateLateFees
        } = body;

        if (!sessionId || !month || !year || !dueDate || !selectedFeeTypeIds || selectedFeeTypeIds.length === 0) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // 1. Find eligible students
        const studentWhere: any = { status: 'active' };
        if (studentId) {
            studentWhere.studentId = studentId;
        } else if (className) {
            studentWhere.className = className;
            if (section) studentWhere.section = section;
        }

        const students = await prisma.studentDetails.findMany({
            where: studentWhere,
            select: { studentId: true, className: true, section: true }
        });

        if (students.length === 0) {
            return NextResponse.json({ total: 0, generated: 0, skipped: 0, failed: 0, results: [] });
        }

        // 2. Fetch Fee Structures (Items directly) for optimization
        // We want FeeStructureItems that match the selected fee types and exist in FeeStructures for the relevant session/classes
        const feeStructureItems = await prisma.feeStructureItem.findMany({
            where: {
                feeTypeId: { in: selectedFeeTypeIds },
                structure: {
                    sessionId: sessionId,
                    className: studentId ? undefined : (className || undefined)
                }
            },
            include: {
                feeType: true,
                structure: {
                    select: { className: true }
                }
            }
        });

        // Group items by className for easy access
        // Map<className, Item[]>
        const classFeeItems = new Map<string, typeof feeStructureItems>();

        feeStructureItems.forEach(item => {
            const cls = item.structure?.className;
            if (cls) {
                if (!classFeeItems.has(cls)) {
                    classFeeItems.set(cls, []);
                }
                classFeeItems.get(cls)?.push(item);
            }
        });

        const results = [];
        let generatedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;

        // 3. Process each student
        for (const student of students) {
            try {
                // Check if items exist for this student's class
                const items = classFeeItems.get(student.className);

                if (!items || items.length === 0) {
                    results.push({ studentId: student.studentId, status: 'skipped', message: 'No fee structure found for class' });
                    skippedCount++;
                    continue;
                }

                // Check if bill already exists for this month/year/session
                const existingBill = await prisma.demandBill.findFirst({
                    where: {
                        studentId: student.studentId,
                        sessionId,
                        month,
                        year
                    }
                });

                if (existingBill) {
                    results.push({ studentId: student.studentId, status: 'skipped', message: 'Bill already exists' });
                    skippedCount++;
                    continue;
                }

                // Calculate Fee Amount with Discounts
                let totalAmount = 0;
                let totalDiscount = 0;
                const billItemsData = [];

                // Fetch student-specific discounts for this session
                const studentDiscounts = await prisma.studentFeeDiscount.findMany({
                    where: {
                        studentId: student.studentId,
                        sessionId: sessionId,
                        feeTypeId: { in: items.map(i => i.feeTypeId) }
                    }
                });

                // Create a map of discounts by feeTypeId
                const discountMap = new Map<number, { type: string; value: number }>();
                studentDiscounts.forEach(d => {
                    discountMap.set(d.feeTypeId, {
                        type: d.discountType,
                        value: Number(d.discountValue)
                    });
                });

                for (const item of items) {
                    const amount = Number(item.amount);
                    if (amount > 0) {
                        // Prisma include types can be tricky, casting safely
                        const feeTypeName = (item as any).feeType?.name || 'Fee';

                        // Apply discount if exists for this fee type
                        let discountAmount = 0;
                        const discount = discountMap.get(item.feeTypeId);
                        if (discount) {
                            if (discount.type === 'percentage') {
                                discountAmount = Math.round(amount * discount.value / 100);
                            } else {
                                discountAmount = Math.min(discount.value, amount);
                            }
                        }

                        totalAmount += amount;
                        totalDiscount += discountAmount;

                        billItemsData.push({
                            feeTypeId: item.feeTypeId,
                            amount: amount,
                            discountAmount: discountAmount,
                            description: feeTypeName
                        });
                    }
                }

                if (totalAmount === 0) {
                    results.push({ studentId: student.studentId, status: 'skipped', message: 'Total amount is 0' });
                    skippedCount++;
                    continue;
                }

                // Check Previous Dues (sum of pending bills)
                const previousBills = await prisma.demandBill.findMany({
                    where: {
                        studentId: student.studentId,
                        sessionId: sessionId,
                        status: { in: ['PENDING', 'PARTIALLY_PAID'] }
                    }
                });

                const previousDues = previousBills.reduce((sum, b) => sum + (Number(b.netAmount) - Number(b.paidAmount)), 0);

                // Calculate net amount after discount
                const netAmountBeforeAdvance = totalAmount - totalDiscount + previousDues;

                // Calculate available advance balance (total paid - total billed)
                const allBills = await prisma.demandBill.aggregate({
                    where: { studentId: student.studentId, sessionId },
                    _sum: { netAmount: true }
                });
                const allPayments = await prisma.feeTransaction.aggregate({
                    where: { studentId: student.studentId, sessionId },
                    _sum: { amount: true }
                });

                const totalBilled = Number(allBills._sum.netAmount || 0);
                const totalPaid = Number(allPayments._sum.amount || 0);
                const availableAdvance = Math.max(0, totalPaid - totalBilled);

                // Apply advance to this bill
                const advanceToApply = Math.min(availableAdvance, netAmountBeforeAdvance);
                const finalNetAmount = netAmountBeforeAdvance - advanceToApply;

                // Create Bill
                const bill = await prisma.demandBill.create({
                    data: {
                        billNo: `BILL-${year}-${month}-${student.studentId}`,
                        studentId: student.studentId,
                        sessionId,
                        month,
                        year,
                        billDate: new Date(),
                        dueDate: new Date(dueDate),
                        totalAmount: totalAmount,
                        discount: totalDiscount,
                        previousDues: previousDues,
                        netAmount: finalNetAmount,
                        paidAmount: advanceToApply, // Advance applied as payment
                        status: advanceToApply >= finalNetAmount ? 'PAID' : (advanceToApply > 0 ? 'PARTIALLY_PAID' : 'PENDING'),
                        billItems: {
                            create: billItemsData
                        }
                    }
                });

                results.push({ studentId: student.studentId, status: 'success', billNo: bill.billNo, amount: bill.netAmount });
                generatedCount++;

            } catch (err) {
                console.error(`Failed for student ${student.studentId}`, err);
                results.push({ studentId: student.studentId, status: 'failed', message: 'Database error' });
                failedCount++;
            }
        }

        return NextResponse.json({
            total: students.length,
            generated: generatedCount,
            skipped: skippedCount,
            failed: failedCount,
            results
        });

    } catch (error) {
        console.error('Error generating bills:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
