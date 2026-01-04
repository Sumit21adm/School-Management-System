
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const sessions = await prisma.academicSession.findMany();
        console.log('Sessions found:', sessions.length);
        if (sessions.length > 0) {
            console.log('Active session:', sessions.find(s => s.isActive)?.name || 'None');
        }
    } catch (e) {
        console.error('Error connecting to DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
