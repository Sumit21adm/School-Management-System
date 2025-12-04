
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const firstNames = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aaryan', 'Dhruv', 'Kabir', 'Ritvik', 'Gautam',
    'Ananya', 'Diya', 'Gauri', 'Isha', 'Kavya', 'Khushi', 'Meera', 'Nandini', 'Pooja', 'Priya',
    'Riya', 'Saanvi', 'Sanya', 'Shreya', 'Sneha', 'Tanvi', 'Trisha', 'Vani', 'Varsha', 'Yashvi'
];

const lastNames = [
    'Sharma', 'Verma', 'Gupta', 'Malhotra', 'Bhatia', 'Saxena', 'Mehta', 'Jain', 'Singh', 'Kumar',
    'Yadav', 'Das', 'Rao', 'Reddy', 'Nair', 'Patel', 'Shah', 'Joshi', 'Desai', 'Chopra'
];

const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const sections = ['A', 'B', 'C'];

function getRandomElement(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
    console.log('Seeding 100 dummy students...');

    const startDate = new Date('2025-03-01');
    const endDate = new Date('2025-05-31');

    for (let i = 0; i < 100; i++) {
        const firstName = getRandomElement(firstNames);
        const lastName = getRandomElement(lastNames);
        const name = `${firstName} ${lastName}`;
        const fatherName = `${getRandomElement(firstNames)} ${lastName}`;
        const motherName = `${getRandomElement(firstNames)} ${lastName}`; // Simplified

        // Generate unique ID: D-TIMESTAMP-INDEX (Shortened to fit VARCHAR(20))
        const studentId = `D-${Date.now().toString().slice(-8)}-${i}`;

        const admissionDate = getRandomDate(startDate, endDate);
        const dob = getRandomDate(new Date('2010-01-01'), new Date('2018-12-31'));

        await prisma.studentDetails.create({
            data: {
                studentId,
                name,
                fatherName,
                motherName,
                dob,
                gender: Math.random() > 0.5 ? 'Male' : 'Female',
                className: getRandomElement(classes),
                section: getRandomElement(sections),
                admissionDate,
                address: '123 Dummy Street, India',
                phone: '9876543210',
                email: `student${i}@example.com`,
                status: 'active'
            }
        });
    }

    console.log('Seeding completed successfully.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
