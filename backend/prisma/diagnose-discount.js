
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const studentId = 'D-2024-001'; // Example ID, might need to adjust
    const feeTypeName = 'Tuition Fee';

    console.log('--- Diagnosis Start ---');

    // 1. Check Session
    const session = await prisma.academicSession.findFirst({ where: { isActive: true } });
    console.log('Active Session:', session);

    if (!session) {
        console.error('CRITICAL: No active session found!');
        return;
    }

    // 2. Check Fee Type
    const feeType = await prisma.feeType.findFirst({ where: { name: feeTypeName } });
    console.log('Fee Type (Tuition Fee):', feeType);

    if (!feeType) {
        console.error('CRITICAL: Fee Type not found!');
    }

    // 3. Check Student (List first 5 to see formatting)
    const students = await prisma.studentDetails.findMany({ take: 5 });
    console.log('First 5 Students:', students.map(s => ({ id: s.id, studentId: s.studentId, name: s.name })));

    // 4. Try to create discount manually to see error
    if (students.length > 0 && feeType) {
        const targetStudent = students[0];
        console.log(`Attempting to create discount for student: ${targetStudent.studentId} (${targetStudent.name})`);

        try {
            // Check if already exists
            const existing = await prisma.studentFeeDiscount.findUnique({
                where: {
                    studentId_feeTypeId_sessionId: {
                        studentId: targetStudent.studentId,
                        feeTypeId: feeType.id,
                        sessionId: session.id
                    },
                },
            });

            if (existing) {
                console.log('Discount already exists, deleting it to test creation...');
                await prisma.studentFeeDiscount.delete({ where: { id: existing.id } });
            }

            const discount = await prisma.studentFeeDiscount.create({
                data: {
                    studentId: targetStudent.studentId,
                    feeTypeId: feeType.id,
                    sessionId: session.id,
                    discountType: 'FIXED',
                    discountValue: 500,
                    reason: 'Test Diagnosis',
                }
            });
            console.log('SUCCESS: Discount created manually via script:', discount);

            // Clean up
            await prisma.studentFeeDiscount.delete({ where: { id: discount.id } });
            console.log('Cleaned up test discount.');

        } catch (e) {
            console.error('ERROR creating discount:', e);
        }
    }

    console.log('--- Diagnosis End ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
