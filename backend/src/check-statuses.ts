
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const statuses = await prisma.studentDetails.groupBy({
            by: ['status'],
            _count: {
                status: true,
            },
        });
        console.log('Distinct Statuses found in DB:', JSON.stringify(statuses, null, 2));
    } catch (error) {
        console.error('Error fetching statuses:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
