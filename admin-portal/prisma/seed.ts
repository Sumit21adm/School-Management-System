import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Admin Portal database...');

    // Create Super Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const superAdmin = await prisma.adminUser.upsert({
        where: { email: 'admin@schoolsaas.com' },
        update: {},
        create: {
            email: 'admin@schoolsaas.com',
            password: hashedPassword,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
        },
    });
    console.log('✅ Super Admin created:', superAdmin.email);

    // Create Subscription Plans
    const plans = [
        {
            name: 'Starter',
            description: 'Perfect for small schools just getting started',
            pricePerStudent: 15,
            minStudents: 1,
            maxStudents: 200,
            baseFeeMonthly: 0,
            baseFeeYearly: 0,
            yearlyDiscount: 15,
            includedModules: JSON.stringify(['core', 'students']),
            maxUsers: 5,
            isPopular: false,
            sortOrder: 1,
        },
        {
            name: 'Growth',
            description: 'For growing schools with advanced needs',
            pricePerStudent: 12,
            minStudents: 1,
            maxStudents: 1000,
            baseFeeMonthly: 500,
            baseFeeYearly: 5000,
            yearlyDiscount: 15,
            includedModules: JSON.stringify(['core', 'students', 'fees']),
            maxUsers: 20,
            isPopular: true,
            sortOrder: 2,
        },
        {
            name: 'Enterprise',
            description: 'Full-featured solution for large institutions',
            pricePerStudent: 10,
            minStudents: 1,
            maxStudents: null,
            baseFeeMonthly: 2000,
            baseFeeYearly: 20000,
            yearlyDiscount: 20,
            includedModules: JSON.stringify(['core', 'students', 'fees', 'transport', 'exams', 'attendance']),
            maxUsers: null,
            isPopular: false,
            sortOrder: 3,
        },
    ];

    for (const plan of plans) {
        await prisma.subscriptionPlan.upsert({
            where: { name: plan.name },
            update: plan,
            create: plan,
        });
    }
    console.log('✅ Subscription Plans created:', plans.map(p => p.name).join(', '));

    // Create Add-on Modules
    const addons = [
        {
            code: 'transport',
            name: 'Transport Management',
            description: 'Vehicle tracking, route management, and transport fee automation',
            priceMonthly: 300,
            priceYearly: 3000,
            icon: 'bus',
        },
        {
            code: 'exams',
            name: 'Examination Module',
            description: 'Exam scheduling, marks entry, and report card generation',
            priceMonthly: 200,
            priceYearly: 2000,
            icon: 'clipboard',
        },
        {
            code: 'attendance',
            name: 'Attendance Management',
            description: 'Student and staff attendance tracking with reports',
            priceMonthly: 150,
            priceYearly: 1500,
            icon: 'check-circle',
        },
        {
            code: 'library',
            name: 'Library Management',
            description: 'Book cataloging, issue/return tracking, and fine management',
            priceMonthly: 100,
            priceYearly: 1000,
            icon: 'book',
        },
        {
            code: 'sms',
            name: 'SMS & Notifications',
            description: 'Bulk SMS, email notifications, and parent communication',
            priceMonthly: 250,
            priceYearly: 2500,
            icon: 'message',
        },
    ];

    for (const addon of addons) {
        await prisma.addonModule.upsert({
            where: { code: addon.code },
            update: addon,
            create: addon,
        });
    }
    console.log('✅ Add-on Modules created:', addons.map(a => a.name).join(', '));

    // Create System Settings
    const settings = [
        { key: 'gst_rate', value: '18', description: 'GST percentage for invoices' },
        { key: 'trial_days', value: '30', description: 'Default trial period in days' },
        { key: 'invoice_prefix', value: 'INV', description: 'Invoice number prefix' },
        { key: 'currency', value: 'INR', description: 'Default currency' },
        { key: 'company_name', value: 'SchoolSaaS', description: 'Platform name' },
    ];

    for (const setting of settings) {
        await prisma.systemSettings.upsert({
            where: { key: setting.key },
            update: setting,
            create: setting,
        });
    }
    console.log('✅ System Settings configured');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login credentials:');
    console.log('   Email: admin@schoolsaas.com');
    console.log('   Password: admin123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
