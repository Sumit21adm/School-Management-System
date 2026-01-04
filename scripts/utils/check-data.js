
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const counts = await Promise.all([
            prisma.user.count(),
            prisma.user.findMany({ select: { username: true, role: true } }),
            prisma.academicSession.count(),
            prisma.academicSession.findMany({ select: { name: true, isActive: true } }),
            // prisma.schoolClass.count(), // Table missing
            prisma.feeType.count(),
            prisma.studentDetails.count(),
            prisma.examType.count(),
            prisma.subject.count(),
        ]);

        console.log('--- DATA REPORT ---');
        console.log('Users:', counts[0]);
        console.log('User List:', JSON.stringify(counts[1]));
        console.log('Sessions:', counts[2]);
        console.log('Session List:', JSON.stringify(counts[3]));
        console.log('Classes:', counts[4]);
        console.log('Fee Types:', counts[5]);
        console.log('Students:', counts[6]);
        console.log('Exam Types:', counts[7]);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
