import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const drivers = [
    { name: 'Ramesh Kumar', phone: '9876543210', license: 'DL-1234567890123', expiry: '2030-12-31' },
    { name: 'Suresh Singh', phone: '9876543211', license: 'DL-9876543210123', expiry: '2028-06-30' },
    { name: 'Mahesh Yadav', phone: '9876543212', license: 'DL-4561237890123', expiry: '2025-01-01' }, // Expiring soon
];

const officeStaff = [
    { name: 'Priya Sharma', role: UserRole.OFFICE_STAFF, designation: 'Clerk' },
    { name: 'Amit Verma', role: UserRole.ACCOUNTANT, designation: 'Senior Accountant' },
    { name: 'Neha Gupta', role: UserRole.RECEPTIONIST, designation: 'Front Desk Officer' },
    { name: 'Vikram Malhotra', role: UserRole.LIBRARIAN, designation: 'Head Librarian' },
    { name: 'Rajesh Koothrappali', role: UserRole.TEACHER, designation: 'Senior Physics Teacher', dept: 'Science' },
    { name: 'Sheldon Cooper', role: UserRole.TEACHER, designation: 'Physics Teacher', dept: 'Science' },
];

async function main() {
    console.log('🌱 Seeding Dummy Staff Data...');
    const password = await bcrypt.hash('Welcome@123', 10);

    // Seed Drivers
    for (let i = 0; i < drivers.length; i++) {
        const d = drivers[i];
        const username = `driver${i + 1}`;

        // Create User
        const user = await prisma.user.upsert({
            where: { username },
            update: {},
            create: {
                username,
                password,
                name: d.name,
                role: UserRole.DRIVER,
                phone: d.phone,
                active: true,
            }
        });

        // Staff Details
        await prisma.staffDetails.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                designation: 'Driver',
                department: 'Transport',
                joiningDate: new Date(),
            }
        });

        // Driver Details
        await prisma.driverDetails.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                licenseNumber: d.license,
                licenseExpiry: new Date(d.expiry),
                badgeNumber: `BG-${100 + i}`
            }
        });
        console.log(`✅ Created Driver: ${d.name} (${username})`);
    }

    // Seed Office Staff & Teachers
    for (let i = 0; i < officeStaff.length; i++) {
        const s = officeStaff[i];
        const username = s.role.toLowerCase().replace('_', '') + (i + 1);

        const user = await prisma.user.upsert({
            where: { username },
            update: {},
            create: {
                username,
                password,
                name: s.name,
                role: s.role,
                active: true,
            }
        });

        await prisma.staffDetails.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                designation: s.designation,
                department: (s as any).dept || 'Administration',
                joiningDate: new Date(),
            }
        });
        console.log(`✅ Created ${s.role}: ${s.name} (${username})`);
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
