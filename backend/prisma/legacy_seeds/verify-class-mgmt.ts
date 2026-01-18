import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verifying Class Management Data...');

    const sections = await prisma.section.count();
    const teachers = await prisma.user.count({ where: { role: 'TEACHER' } });
    const profiles = await prisma.teacherProfile.count();
    const assignments = await prisma.classTeacherAssignment.count();
    const allocations = await prisma.subjectTeacherAllocation.count();
    const routines = await prisma.classRoutine.count();

    console.log(`Sections: ${sections}`);
    console.log(`Teachers: ${teachers}`);
    console.log(`Profiles: ${profiles}`);
    console.log(`Class Teacher Assignments: ${assignments}`);
    console.log(`Subject Allocations: ${allocations}`);
    console.log(`Routine Entries: ${routines}`);

    if (sections === 0 || teachers === 0) {
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
