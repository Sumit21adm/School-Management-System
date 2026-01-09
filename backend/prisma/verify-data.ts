import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verifying Data...');

    const students = await prisma.studentDetails.count();
    const feeStructures = await prisma.feeStructure.count();
    const feeStructureItems = await prisma.feeStructureItem.count();
    const demandBills = await prisma.demandBill.count();
    const transactions = await prisma.feeTransaction.count();

    console.log(`Students: ${students}`);
    console.log(`Fee Structures: ${feeStructures}`);
    console.log(`Fee Structure Items: ${feeStructureItems}`);
    console.log(`Demand Bills: ${demandBills}`);
    console.log(`Transactions: ${transactions}`);

    if (students === 0 || feeStructures === 0) {
        console.error('❌ detailed verification failed: No data found');
        process.exit(1);
    }
    console.log('✅ Verification passed');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
