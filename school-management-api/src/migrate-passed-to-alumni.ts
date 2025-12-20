
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const result = await prisma.studentDetails.updateMany({
            where: {
                status: 'passed',
            },
            data: {
                status: 'alumni',
            },
        });
        console.log(`Updated ${result.count} students from 'passed' to 'alumni'.`);
    } catch (error) {
        console.error('Error migrating statuses:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
