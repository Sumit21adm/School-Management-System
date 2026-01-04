
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- STUDENT DEBUG ---');

        // 1. Check Sessions
        const sessions = await prisma.academicSession.findMany();
        console.log('Sessions:', JSON.stringify(sessions, null, 2));

        // 2. Check Students Count by Session and Status
        const distribution = await prisma.studentDetails.groupBy({
            by: ['sessionId', 'status'],
            _count: {
                id: true
            }
        });
        console.log('Student Distribution:', JSON.stringify(distribution, null, 2));

        // 3. Sample Student
        const sample = await prisma.studentDetails.findFirst();
        console.log('Sample Student:', sample ? {
            id: sample.id,
            name: sample.name,
            status: sample.status,
            sessionId: sample.sessionId
        } : 'None');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
