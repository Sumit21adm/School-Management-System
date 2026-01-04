"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🗑️  Wiping School Classes...');
    console.log('... Deleting Fee Structures (referencing classes)');
    await prisma.feeStructure.deleteMany({});
    console.log('... Deleting Exam Schedules (referencing classes)');
    await prisma.examSchedule.deleteMany({});
    console.log('... Deleting School Classes');
    await prisma.schoolClass.deleteMany({});
    console.log('✅ School Classes wiped.');
    const count = await prisma.schoolClass.count();
    console.log(`Current Class Count: ${count}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=wipe_classes.js.map