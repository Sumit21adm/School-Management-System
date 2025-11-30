
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const students = await prisma.studentDetails.findMany();
    console.log('Total students:', students.length);
    students.forEach(s => {
        console.log(`ID: ${s.id}, Name: ${s.name}, Status: ${s.status}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
