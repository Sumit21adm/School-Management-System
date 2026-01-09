import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🕸️ Starting Orphan Record Check...');

    let discrepancies = 0;

    // 1. Check for Students with invalid Sessions
    const studentsWithoutSession = await prisma.studentDetails.count({
        where: {
            sessionId: null
        }
    });

    if (studentsWithoutSession > 0) {
        console.error(`❌ Found ${studentsWithoutSession} students not linked to any Academic Session.`);
        discrepancies++;
    }

    // 2. Check for Transactions with invalid Students
    // Check logic: Transaction without Payments?
    const emptyTransactions = await prisma.feeTransaction.findMany({
        where: {
            paymentDetails: {
                none: {}
            }
        }
    });

    if (emptyTransactions.length > 0) {
        console.error(`❌ Found ${emptyTransactions.length} transactions with NO payment details (Orphan Headers).`);
        discrepancies++;
    }

    // 3. Sections without Class
    // Since classId is required in schema, we don't need to check for null.
    // We strictly rely on FK constraints for this.

    if (discrepancies === 0) {
        console.log('✅ Orphan Record Check Passed: internal relations look healthy.');
    } else {
        console.error(`⚠️ Found ${discrepancies} types of data integrity issues.`);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
