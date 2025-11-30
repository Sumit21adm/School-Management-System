import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const students = await prisma.studentDetails.findMany({
        select: {
            id: true,
            name: true,
            studentId: true,
            photoUrl: true,
        },
    });
    console.log(JSON.stringify(students, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
