
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function logStep(step: string) {
    console.log(`\n🔹 [STEP] ${step}`);
}

// ============================================
// PHASE 1: CORE CONFIGURATION (Required for App)
// ============================================
export async function seedCoreSettings() {
    logStep('Phase 1: Establishing Core Settings');

    // 1.0 Role Settings (CRITICAL)
    const ROLE_DEFINITIONS = [
        // Administrative Roles
        { role: 'SUPER_ADMIN', displayName: 'Super Administrator', description: 'Full system access', isEnabled: true, sortOrder: 1 },
        { role: 'PRINCIPAL', displayName: 'Principal', description: 'School head', isEnabled: true, sortOrder: 2 },
        { role: 'VICE_PRINCIPAL', displayName: 'Vice Principal', description: 'Deputy head', isEnabled: true, sortOrder: 3 },
        { role: 'ADMIN', displayName: 'Administrator', description: 'School admin', isEnabled: true, sortOrder: 4 },
        // Academic Roles
        { role: 'HEAD_OF_DEPARTMENT', displayName: 'Head of Department', description: 'HOD', isEnabled: true, sortOrder: 10 },
        { role: 'COORDINATOR', displayName: 'Coordinator', description: 'Academic coordinator', isEnabled: true, sortOrder: 11 },
        { role: 'SECTION_INCHARGE', displayName: 'Section In-charge', description: 'Class teacher', isEnabled: true, sortOrder: 12 },
        { role: 'TEACHER', displayName: 'Teacher', description: 'Teaching staff', isEnabled: true, sortOrder: 13 },
        // Finance & Office
        { role: 'ACCOUNTANT', displayName: 'Accountant', description: 'Finance & Fees', isEnabled: true, sortOrder: 20 },
        { role: 'RECEPTIONIST', displayName: 'Receptionist', description: 'Front desk', isEnabled: true, sortOrder: 21 },
        { role: 'LIBRARIAN', displayName: 'Librarian', description: 'Library', isEnabled: true, sortOrder: 22 },
        { role: 'LAB_ASSISTANT', displayName: 'Lab Assistant', description: 'Lab support', isEnabled: false, sortOrder: 23 },
        { role: 'OFFICE_STAFF', displayName: 'Office Staff', description: 'General staff', isEnabled: true, sortOrder: 24 },
        { role: 'CLERK', displayName: 'Clerk', description: 'Clerical work', isEnabled: false, sortOrder: 25 },
        // Transport & Support
        { role: 'DRIVER', displayName: 'Driver', description: 'Bus driver', isEnabled: true, sortOrder: 30 },
        { role: 'CONDUCTOR', displayName: 'Conductor', description: 'Bus support', isEnabled: true, sortOrder: 31 },
        { role: 'SECURITY', displayName: 'Security Guard', description: 'Security', isEnabled: true, sortOrder: 32 },
        { role: 'PEON', displayName: 'Peon', description: 'Support', isEnabled: false, sortOrder: 33 },
        // External
        { role: 'PARENT', displayName: 'Parent', description: 'Parent Portal', isEnabled: false, sortOrder: 90 },
        { role: 'STUDENT', displayName: 'Student', description: 'Student Portal', isEnabled: false, sortOrder: 91 },
    ];

    for (const roleDef of ROLE_DEFINITIONS) {
        await prisma.roleSettings.upsert({
            where: { role: roleDef.role },
            update: { displayName: roleDef.displayName, sortOrder: roleDef.sortOrder },
            create: roleDef
        });
    }
    console.log('   ✅ Role Settings configured');

    // 1.1 Print Settings (School Identity)
    const schoolName = 'Global Excellence Academy';
    await prisma.printSettings.upsert({
        where: { id: 1 },
        update: { schoolName },
        create: {
            schoolName,
            schoolAddress: 'Campus 12, Tech Park Road, Update Your Address',
            phone: '+91 98765 43210',
            email: 'admin@school.com',
            website: 'www.school.com',
            tagline: 'Excellence in Education',
            timezone: 'Asia/Kolkata',
        }
    });
    console.log('   ✅ Print Settings configured');

    // 1.2 Academic Sessions
    const sessions = [
        { name: '2023-2024', startDate: new Date('2023-04-01'), endDate: new Date('2024-03-31'), isActive: false },
        { name: '2024-2025', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), isActive: true },
        { name: '2025-2026', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31'), isActive: false, isSetupMode: true },
    ];

    for (const s of sessions) {
        await prisma.academicSession.upsert({
            where: { name: s.name },
            update: { isActive: s.isActive },
            create: s
        });
    }
    console.log(`   ✅ ${sessions.length} Academic Sessions synced`);

    // 1.3 Fee Types (System Standards)
    const feeTypes = [
        { name: 'Tuition Fee', frequency: 'Monthly', isRecurring: true, isDefault: true },
        { name: 'Transport Fee', frequency: 'Monthly', isRecurring: true, description: 'Bus/Van Charges' },
        { name: 'Annual Charges', frequency: 'Yearly', isRecurring: false },
        { name: 'Admission Fee', frequency: 'One-time', isRecurring: false },
        { name: 'Late Fee', frequency: 'One-time', description: 'Penalty for overdue payment' },
        { name: 'Advance Payment', frequency: 'One-time', description: 'Advance fee payment (System)', isRecurring: false },
    ];

    for (const f of feeTypes) {
        await prisma.feeType.upsert({
            where: { name: f.name },
            update: { frequency: f.frequency, isRecurring: f.isRecurring },
            create: f
        });
    }
    console.log(`   ✅ ${feeTypes.length} System Fee Types defined`);
}

// ============================================
// PHASE 2: SUPER ADMIN USER
// ============================================
export async function seedAdminUser() {
    logStep('Phase 2: Creating Super Admin');
    const password = await bcrypt.hash('password123', 10);

    await prisma.user.upsert({
        where: { username: 'superadmin' },
        update: {},
        create: {
            username: 'superadmin',
            password, // password123
            name: 'System Administrator',
            email: 'admin@school.com',
            role: UserRole.SUPER_ADMIN,
            active: true
        }
    });
    console.log('   ✅ Super Admin created (User: superadmin / Pass: password123)');
}

// ============================================
// PHASE 3: ACADEMIC STRUCTURE (Classes)
// ============================================
export async function seedClasses() {
    logStep('Phase 3: Creating Classes & Sections');

    const classes = [
        { name: 'NC', displayName: 'NC', order: 1 },
        { name: 'LKG', displayName: 'LKG', order: 2 },
        { name: 'UKG', displayName: 'UKG', order: 3 },
        { name: 'I', displayName: 'Class I', order: 4 },
        { name: 'II', displayName: 'Class II', order: 5 },
        { name: 'III', displayName: 'Class III', order: 6 },
        { name: 'IV', displayName: 'Class IV', order: 7 },
        { name: 'V', displayName: 'Class V', order: 8 },
        { name: 'VI', displayName: 'Class VI', order: 9 },
        { name: 'VII', displayName: 'Class VII', order: 10 },
        { name: 'VIII', displayName: 'Class VIII', order: 11 },
        { name: 'IX', displayName: 'Class IX', order: 12 },
        { name: 'X', displayName: 'Class X', order: 13 },
        { name: 'XI', displayName: 'Class XI', order: 14 },
        { name: 'XII', displayName: 'Class XII', order: 15 },
    ];

    for (const cls of classes) {
        // 1. Create Class
        const classRecord = await prisma.schoolClass.upsert({
            where: { name: cls.name },
            update: { displayName: cls.displayName, order: cls.order },
            create: { name: cls.name, displayName: cls.displayName, order: cls.order }
        });

        // 2. Create Default Section 'A'
        await prisma.section.upsert({
            where: {
                classId_name: {
                    name: 'A',
                    classId: classRecord.id
                }
            },
            update: {},
            create: {
                name: 'A',
                classId: classRecord.id,
                capacity: 40
            }
        });
    }
    console.log(`   ✅ ${classes.length} Classes (with Section A) created`);
}

// MAIN EXECUTION
async function main() {
    console.log('🚀 Starting Default Seed (Essentials Only)...');

    await seedCoreSettings();
    await seedAdminUser();
    await seedClasses();

    console.log('\n✨ Default Configuration Completed! The School is ready to run.');
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error(e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
