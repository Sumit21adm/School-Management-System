
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const admissionFee = await prisma.feeType.findUnique({
        where: { name: 'Admission Fee' },
    });

    if (!admissionFee) {
        await prisma.feeType.create({
            data: {
                name: 'Admission Fee',
                description: 'One-time admission fee for new students',
                isActive: true,
                isDefault: false,
                isRecurring: false,
                frequency: 'One-time',
            },
        });
        console.log('Admission Fee type created.');
    } else {
        console.log('Admission Fee type already exists.');
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
