import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Wiping School Classes...');

    // Note: This might fail if classes are referenced by other tables not yet cleared (though we cleared most in the previous step)
    // key dependencies: StudentDetails (already cleared), FeeStructure (maybe?), FeeStructureItem?

    // We need to clear FeeStructures if they reference classes to be safe, or just try deleting classes and handle errors.
    // Given the previous wipe_data.ts cleared student-related data, we might still have FeeStructures referenced by classes.

    console.log('... Deleting Fee Structures (referencing classes)');
    await prisma.feeStructure.deleteMany({});

    console.log('... Deleting Exam Schedules (referencing classes)');
    await prisma.examSchedule.deleteMany({});

    // StudentAcademicHistory was cleared in previous step.

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
