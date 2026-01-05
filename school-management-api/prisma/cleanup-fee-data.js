const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupFeeData() {
    console.log('Starting fee data cleanup...');

    try {
        // Delete in order to respect foreign key constraints

        // 1. Delete FeePaymentDetail (child of FeeTransaction)
        const deletedPaymentDetails = await prisma.feePaymentDetail.deleteMany({});
        console.log(`Deleted ${deletedPaymentDetails.count} FeePaymentDetail records`);

        // 2. Delete FeeTransaction
        const deletedTransactions = await prisma.feeTransaction.deleteMany({});
        console.log(`Deleted ${deletedTransactions.count} FeeTransaction records`);

        // 3. Delete DemandBillItem (child of DemandBill)
        const deletedBillItems = await prisma.demandBillItem.deleteMany({});
        console.log(`Deleted ${deletedBillItems.count} DemandBillItem records`);

        // 4. Delete DemandBill
        const deletedBills = await prisma.demandBill.deleteMany({});
        console.log(`Deleted ${deletedBills.count} DemandBill records`);

        console.log('\\nFee data cleanup completed successfully!');
        console.log('You can now:');
        console.log('1. Generate fresh demand bills');
        console.log('2. Collect fees (which will update bill.paidAmount correctly)');

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupFeeData();
