
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const studentId = 'ST20240050'; // Marc Grady

    console.log('--- Debugging Transport Data for', studentId, '---');

    // 1. Check Student Transport
    const student = await prisma.studentDetails.findUnique({
        where: { studentId },
        include: {
            transport: {
                include: {
                    route: true,
                    pickupStop: true,
                    dropStop: true
                }
            }
        }
    });

    if (!student) {
        console.log('Student not found!');
    } else if (!student.transport) {
        console.log('No Transport assigned to student.');
    } else {
        console.log('Transport Record:');
        console.log(JSON.stringify(student.transport, null, 2));
        console.log('Status Case Check:', `"${student.transport.status}"`);
        console.log('Is Active (strict === "active")?', student.transport.status === 'active');
    }

    // 2. Check Fee Type
    const feeType = await prisma.feeType.findFirst({
        where: { name: { contains: 'Transport' } }
    });
    console.log('Transport Fee Type:', feeType);

    // 3. Check Fare Slabs
    const slabs = await prisma.transportFareSlab.findMany({
        where: { isActive: true }
    });
    console.log('Active Fare Slabs:', slabs);

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
