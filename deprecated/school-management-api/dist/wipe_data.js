"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🗑️  Starting database cleanup...');
    console.log('... Deleting Fee Payment Details');
    await prisma.feePaymentDetail.deleteMany({});
    console.log('... Deleting Fee Transactions');
    await prisma.feeTransaction.deleteMany({});
    console.log('... Deleting Demand Bill Items');
    await prisma.demandBillItem.deleteMany({});
    console.log('... Deleting Demand Bills');
    await prisma.demandBill.deleteMany({});
    console.log('... Deleting Student Fee Discounts');
    await prisma.studentFeeDiscount.deleteMany({});
    console.log('... Deleting Student Academic History');
    await prisma.studentAcademicHistory.deleteMany({});
    console.log('... Deleting Students');
    await prisma.studentDetails.deleteMany({});
    console.log('✅ Cleanup completed. All student data removed.');
    const studentCount = await prisma.studentDetails.count();
    console.log(`Current Student Count: ${studentCount}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=wipe_data.js.map