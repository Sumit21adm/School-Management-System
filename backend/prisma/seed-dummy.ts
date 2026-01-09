import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Helper to get random item from array
const random = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
    console.log('🌱 Starting dummy data seeding...');

    // 1. Get Prerequisites (Session, Classes, Fee Types)
    const session = await prisma.academicSession.findFirst({
        where: { isActive: true },
    });

    if (!session) {
        throw new Error('Active Academic Session not found. Run main seed first.');
    }

    const classes = await prisma.schoolClass.findMany({
        orderBy: { order: 'asc' },
    });

    if (classes.length === 0) {
        throw new Error('Classes not found. Run main seed first.');
    }

    const feeTypes = await prisma.feeType.findMany();

    // Organize Fee Types
    const tuitionFee = feeTypes.find(f => f.name === 'Tuition Fee');
    const termFees = feeTypes.filter(f => ['Computer Fee', 'Library Fee', 'Sports Fee'].includes(f.name));
    const admissionFee = feeTypes.find(f => f.name === 'Admission Fee') ||
        feeTypes.find(f => f.name === 'Development Fee');

    if (!tuitionFee) throw new Error('Tuition Fee type not found');

    console.log(`Found Session: ${session.name}, ${classes.length} Classes, ${feeTypes.length} Fee Types`);

    // 2. Create Fee Structures (if not exist)
    console.log('Creating Fee Structures...');
    for (const cls of classes) {
        const structure = await prisma.feeStructure.upsert({
            where: {
                sessionId_className: {
                    sessionId: session.id,
                    className: cls.name,
                }
            },
            update: {},
            create: {
                sessionId: session.id,
                className: cls.name,
                description: `Standard Fee Structure for ${cls.displayName}`,
            }
        });

        // Add Tuition Fee
        const baseTuition = 1500 + (cls.order * 200); // 1700 to 4500 roughly

        await prisma.feeStructureItem.upsert({
            where: {
                structureId_feeTypeId: {
                    structureId: structure.id,
                    feeTypeId: tuitionFee.id
                }
            },
            update: {},
            create: {
                structureId: structure.id,
                feeTypeId: tuitionFee.id,
                amount: baseTuition,
                frequency: 'Monthly'
            }
        });

        // Add other fees randomly
        for (const termFee of termFees) {
            await prisma.feeStructureItem.upsert({
                where: {
                    structureId_feeTypeId: {
                        structureId: structure.id,
                        feeTypeId: termFee.id
                    }
                },
                update: {},
                create: {
                    structureId: structure.id,
                    feeTypeId: termFee.id,
                    amount: 500 + Math.floor(Math.random() * 500),
                    frequency: 'Yearly'
                }
            });
        }
    }

    // 3. Create Dummy Students
    console.log('Creating Dummy Students...');
    const studentCount = 50;

    for (let i = 0; i < studentCount; i++) {
        const cls = random(classes);
        const gender = random(['Male', 'Female']);
        const firstName = faker.person.firstName(gender === 'Male' ? 'male' : 'female');
        const lastName = faker.person.lastName();
        const studentId = `ST${20240001 + i}`;

        const student = await prisma.studentDetails.upsert({
            where: { studentId },
            update: {},
            create: {
                studentId,
                name: `${firstName} ${lastName}`,
                fatherName: faker.person.fullName({ sex: 'male' }),
                motherName: faker.person.fullName({ sex: 'female' }),
                dob: faker.date.birthdate({ min: 5, max: 18, mode: 'age' }),
                gender: gender,
                className: cls.name,
                section: random(['A', 'B']),
                admissionDate: faker.date.past({ years: 2 }),
                address: faker.location.streetAddress(),
                phone: faker.string.numeric(10),
                status: 'active',
                sessionId: session.id,
                category: random(['General', 'OBC', 'SC/ST']),
            }
        });

        // 4. Create Demand Bills for April 2024
        // Simplified: Just one bill for now per student
        const billAmount = 2000;
        const bill = await prisma.demandBill.create({
            data: {
                billNo: `BILL/24-25/${1000 + i}`,
                studentId: student.studentId,
                sessionId: session.id,
                month: 4,
                year: 2024,
                billDate: new Date('2024-04-01'),
                dueDate: new Date('2024-04-15'),
                totalAmount: billAmount,
                netAmount: billAmount,
                status: 'PENDING',
            }
        });

        // Add bill items
        await prisma.demandBillItem.create({
            data: {
                billId: bill.id,
                feeTypeId: tuitionFee.id,
                amount: billAmount,
            }
        });

        // Randomly pay some bills
        if (Math.random() > 0.5) {
            const paidAmount = Math.random() > 0.8 ? billAmount : billAmount / 2; // Full or Partial

            const transaction = await prisma.feeTransaction.create({
                data: {
                    transactionId: `TXN${Date.now()}${i}`,
                    studentId: student.studentId,
                    sessionId: session.id,
                    receiptNo: `REC/24-25/${1000 + i}`,
                    amount: paidAmount,
                    description: 'Tuition Fee Payment',
                    paymentMode: random(['CASH', 'UPI', 'CARD']),
                    date: new Date(),
                    yearId: 2024,
                }
            });

            await prisma.feePaymentDetail.create({
                data: {
                    transactionId: transaction.id,
                    feeTypeId: tuitionFee.id,
                    amount: paidAmount,
                    netAmount: paidAmount,
                }
            });

            // Update Bill Status
            const newStatus = paidAmount >= billAmount ? 'PAID' : 'PARTIALLY_PAID';
            await prisma.demandBill.update({
                where: { id: bill.id },
                data: {
                    paidAmount: paidAmount,
                    status: newStatus,
                    paidDate: new Date()
                }
            });
        }
    }

    console.log('✅ Dummy data generated successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
