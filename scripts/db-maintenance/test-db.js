
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing connection...');
        for (let i = 0; i < 5; i++) {
            const start = Date.now();
            const user = await prisma.user.findFirst();
            console.log(`Query ${i + 1}: Success in ${Date.now() - start}ms`);
            await new Promise(r => setTimeout(r, 500));
        }
        console.log('Connection test passed!');
    } catch (e) {
        console.error('Connection failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
