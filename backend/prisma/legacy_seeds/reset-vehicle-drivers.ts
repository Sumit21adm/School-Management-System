import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Resetting Vehicle driver assignments...');
    // Using raw query to be safe against schema mismatches
    try {
        await prisma.$executeRawUnsafe('UPDATE vehicles SET driverId = NULL');
        console.log('✅ Vehicle driver assignments cleared.');
    } catch (e) {
        console.error('Error clearing vehicle drivers:', e);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
