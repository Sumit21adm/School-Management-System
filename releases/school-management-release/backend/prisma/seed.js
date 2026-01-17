"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { username: 'superadmin' },
        update: {},
        create: {
            username: 'superadmin',
            password: hashedPassword,
            name: 'Super Administrator',
            email: 'superadmin@school.com',
            role: 'SUPER_ADMIN',
            active: true,
        },
    });
    console.log('✅ Super Admin user created:', admin.email);
    console.log('   Username: superadmin');
    console.log('   Password: admin123');
    // Create default fee types
    const feeTypes = [
        { name: 'Tuition Fee', description: 'Main tuition fee', isDefault: true, isRecurring: true, frequency: 'Monthly' },
        { name: 'Computer Fee', description: 'Computer lab and IT infrastructure' },
        { name: 'Laboratory Fee', description: 'Laboratory and practical work', frequency: 'Yearly' },
        { name: 'Exam Fee', description: 'Examination and assessment' },
        { name: 'Library Fee', description: 'Library access and maintenance', frequency: 'Yearly' },
        { name: 'Sports Fee', description: 'Sports facilities and equipment' },
        { name: 'Miscellaneous Fee', description: 'Other charges' },
        { name: 'Late Fee', description: 'Late payment charges', frequency: 'One-time' },
        { name: 'Development Fee', description: 'School development and infrastructure', frequency: 'Yearly' },
        // One-time fees (available in Fee Collection but not in Demand Bills)
        { name: 'Dress Fee', description: 'School uniform and dress', frequency: 'One-time' },
        { name: 'Caution Money', description: 'Refundable security deposit', frequency: 'Refundable' },
        { name: 'Advance Payment', description: 'Advance fee payment', frequency: 'One-time' },
    ];
    const createdFeeTypes = {};
    for (const feeType of feeTypes) {
        const created = await prisma.feeType.upsert({
            where: { name: feeType.name },
            update: feeType, // Update with new data including frequency
            create: feeType,
        });
        createdFeeTypes[feeType.name] = created;
    }
    // Explicitly set frequency to NULL for fees that should have no badge
    const feesWithoutBadge = ['Computer Fee', 'Exam Fee', 'Sports Fee', 'Miscellaneous Fee', 'Activity Fee'];
    for (const feeName of feesWithoutBadge) {
        await prisma.feeType.updateMany({
            where: { name: feeName },
            data: { frequency: null },
        });
    }
    /* Redundant block removed */
    console.log('✅ Fee types created');
    // Seed Classes
    const classes = [
        { name: 'Mount 1', displayName: 'Mount 1', order: 1 },
        { name: 'Mount 2', displayName: 'Mount 2', order: 2 },
        { name: 'Mount 3', displayName: 'Mount 3', order: 3 },
        { name: '1', displayName: 'Class 1', order: 4 },
        { name: '2', displayName: 'Class 2', order: 5 },
        { name: '3', displayName: 'Class 3', order: 6 },
        { name: '4', displayName: 'Class 4', order: 7 },
        { name: '5', displayName: 'Class 5', order: 8 },
        { name: '6', displayName: 'Class 6', order: 9 },
        { name: '7', displayName: 'Class 7', order: 10 },
        { name: '8', displayName: 'Class 8', order: 11 },
        { name: '9', displayName: 'Class 9', order: 12 },
        { name: '10', displayName: 'Class 10', order: 13 },
        { name: '11', displayName: 'Class 11', order: 14 },
        { name: '12', displayName: 'Class 12', order: 15 },
    ];
    for (const cls of classes) {
        await prisma.schoolClass.upsert({
            where: { name: cls.name },
            update: { order: cls.order, displayName: cls.displayName },
            create: {
                name: cls.name,
                displayName: cls.displayName,
                order: cls.order,
            },
        });
    }
    console.log('✅ Classes created');
    // Create academic session
    const session = await prisma.academicSession.upsert({
        where: { name: 'APR 2024-MAR 2025' },
        update: {},
        create: {
            name: 'APR 2024-MAR 2025',
            startDate: new Date('2024-04-01'),
            endDate: new Date('2025-03-31'),
            isActive: true,
        },
    });
    console.log('✅ Academic session created:', session.name);
    // Create default subjects
    const subjects = [
        { name: 'Mathematics', code: 'MATH', description: 'Mathematics and Numerical Skills', color: '#3B82F6' },
        { name: 'Science', code: 'SCI', description: 'General Science', color: '#10B981' },
        { name: 'English', code: 'ENG', description: 'English Language and Literature', color: '#EF4444' },
        { name: 'Hindi', code: 'HIN', description: 'Hindi Language', color: '#F59E0B' },
        { name: 'Social Studies', code: 'SST', description: 'History, Geography, Civics', color: '#8B5CF6' },
        { name: 'Computer Science', code: 'CS', description: 'Computer and IT Skills', color: '#06B6D4' },
        { name: 'Physical Education', code: 'PE', description: 'Sports and Physical Activities', color: '#EC4899' },
        { name: 'Art & Craft', code: 'ART', description: 'Drawing and Creative Arts', color: '#F97316' },
    ];
    for (const subject of subjects) {
        await prisma.subject.upsert({
            where: { code: subject.code },
            update: {},
            create: subject,
        });
    }
    console.log('✅ Subjects created');
    // NOTE: Sample data generation (Students, Fee Structures) has been removed as per request.
    // The system will start with:
    // 1. Admin User (admin/admin123)
    // 2. Default Fee Types
    // 3. Current Academic Session
    console.log('\n🎉 System initialization completed successfully!');
    console.log('📊 Summary:');
    console.log('   - 1 Admin user');
    console.log('   - 12 Fee types');
    console.log('   - 8 Subjects');
    console.log('   - 1 Academic session');
    console.log('   - 0 Students (Clean state)');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
