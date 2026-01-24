
import { PrismaClient } from '@prisma/client';

async function verify() {
    const prisma = new PrismaClient();

    try {
        // 1. Verify Student Exists
        const student = await prisma.studentDetails.findUnique({
            where: { studentId: 'TEST-STU-001' }
        });
        console.log('Student:', student ? 'Found' : 'Not Found');
        if (!student) {
            console.error('CRITICAL: Student not created.');
            return;
        }

        // 2. Verify Session ID for Discount
        // We expect the discount for Tuition Fee to be in Session "APR 2023 - MAR 2024" (ID 9)
        // First, find the session ID for 2023-2024
        const targetSession = await prisma.academicSession.findUnique({
            where: { name: 'APR 2023 - MAR 2024' }
        });

        if (!targetSession) {
            console.error('Target session not found in DB');
            return;
        }
        console.log('Target Session ID:', targetSession.id);

        // Find the discount
        // We need to know Fee Type ID for Tuition Fee
        const feeType = await prisma.feeType.findUnique({
            where: { name: 'Tuition Fee' }
        });

        if (!feeType) {
            console.error('Tuition Fee type not found');
            return;
        }

        const discount = await prisma.studentFeeDiscount.findUnique({
            where: {
                studentId_feeTypeId_sessionId: {
                    studentId: 'TEST-STU-001',
                    feeTypeId: feeType.id,
                    sessionId: targetSession.id
                }
            }
        });

        if (discount) {
            console.log('SUCCESS: Discount found for Historical Session!');
            console.log(discount);
        } else {
            console.error('FAILURE: Discount NOT found for Historical Session.');
            // Check if it exists in ACTIVE session (ID 10)
            const activeSession = await prisma.studentFeeDiscount.findFirst({
                where: {
                    studentId: 'TEST-STU-001',
                    feeTypeId: feeType.id
                },
                include: { session: true }
            });
            if (activeSession) {
                console.log('Found discount in WRONG session:', activeSession.session.name);
            } else {
                console.log('No discount found at all.');
            }
        }

        // 3. Verify Auto-Created Fee Type
        const newFeeType = await prisma.feeType.findUnique({
            where: { name: 'Special Test Fee' }
        });

        if (newFeeType) {
            console.log('SUCCESS: Auto-created Fee Type found!');
            console.log(newFeeType);
        } else {
            console.error('FAILURE: Auto-created Fee Type NOT found.');
        }

    } catch (error) {
        console.error('Error verifying:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
