
const { PrismaClient } = require('@prisma/client');

async function verify() {
    const prisma = new PrismaClient();

    try {
        console.log('Connecting to database...');
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
        console.log('Verifying Discount for Session "APR 2023 - MAR 2024"...');
        const targetSession = await prisma.academicSession.findUnique({
            where: { name: 'APR 2023 - MAR 2024' }
        });

        if (!targetSession) {
            console.error('Target session not found in DB');
            return;
        }
        console.log('Target Session ID:', targetSession.id);

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
            console.log('Discount Record:', JSON.stringify(discount, null, 2));
        } else {
            console.error('FAILURE: Discount NOT found for Historical Session.');
            // Debug info
            const allDiscounts = await prisma.studentFeeDiscount.findMany({
                where: { studentId: 'TEST-STU-001', feeTypeId: feeType.id },
                include: { session: true }
            });
            console.log('All discounts for student/feeType:', JSON.stringify(allDiscounts, null, 2));
        }

        // 3. Verify Auto-Created Fee Type
        console.log('Verifying Auto-Created Fee Type "Special Test Fee"...');
        const newFeeType = await prisma.feeType.findFirst({
            where: { name: 'Special Test Fee' }
        });

        if (newFeeType) {
            console.log('SUCCESS: Auto-created Fee Type found!');
            console.log('Fee Type:', JSON.stringify(newFeeType, null, 2));
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
