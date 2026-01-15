import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Role definitions with display names, descriptions, and default enabled status
const ROLE_DEFINITIONS = [
    // Administrative Roles
    { role: 'SUPER_ADMIN', displayName: 'Super Administrator', description: 'Full system access', isEnabled: true, sortOrder: 1 },
    { role: 'PRINCIPAL', displayName: 'Principal', description: 'School head with elevated permissions', isEnabled: true, sortOrder: 2 },
    { role: 'VICE_PRINCIPAL', displayName: 'Vice Principal', description: 'Deputy to Principal', isEnabled: true, sortOrder: 3 },
    { role: 'ADMIN', displayName: 'Administrator', description: 'School administration', isEnabled: true, sortOrder: 4 },

    // Academic Roles
    { role: 'HEAD_OF_DEPARTMENT', displayName: 'Head of Department', description: 'Department head (HOD)', isEnabled: true, sortOrder: 10 },
    { role: 'COORDINATOR', displayName: 'Coordinator', description: 'Academic coordinator', isEnabled: true, sortOrder: 11 },
    { role: 'SECTION_INCHARGE', displayName: 'Section In-charge', description: 'Class/Section in-charge teacher', isEnabled: true, sortOrder: 12 },
    { role: 'TEACHER', displayName: 'Teacher', description: 'Teaching staff', isEnabled: true, sortOrder: 13 },

    // Finance & Office
    { role: 'ACCOUNTANT', displayName: 'Accountant', description: 'Fee collection and finance', isEnabled: true, sortOrder: 20 },
    { role: 'RECEPTIONIST', displayName: 'Receptionist', description: 'Front desk and basic data entry', isEnabled: true, sortOrder: 21 },
    { role: 'LIBRARIAN', displayName: 'Librarian', description: 'Library management', isEnabled: true, sortOrder: 22 },
    { role: 'LAB_ASSISTANT', displayName: 'Lab Assistant', description: 'Science/Computer lab assistant', isEnabled: false, sortOrder: 23 },
    { role: 'OFFICE_STAFF', displayName: 'Office Staff', description: 'General office work', isEnabled: true, sortOrder: 24 },
    { role: 'CLERK', displayName: 'Clerk', description: 'Administrative clerk', isEnabled: false, sortOrder: 25 },

    // Transport & Support
    { role: 'DRIVER', displayName: 'Driver', description: 'Vehicle driver', isEnabled: true, sortOrder: 30 },
    { role: 'CONDUCTOR', displayName: 'Conductor', description: 'Bus conductor', isEnabled: true, sortOrder: 31 },
    { role: 'SECURITY', displayName: 'Security Guard', description: 'Security staff', isEnabled: true, sortOrder: 32 },
    { role: 'PEON', displayName: 'Peon', description: 'Support staff', isEnabled: false, sortOrder: 33 },

    // External Users
    { role: 'PARENT', displayName: 'Parent', description: 'Student parent (read-only access)', isEnabled: false, sortOrder: 90 },
    { role: 'STUDENT', displayName: 'Student', description: 'Student portal access', isEnabled: false, sortOrder: 91 },
];

async function seedRoleSettings() {
    console.log('🔄 Seeding Role Settings...');

    for (const roleDef of ROLE_DEFINITIONS) {
        await prisma.roleSettings.upsert({
            where: { role: roleDef.role },
            update: {
                displayName: roleDef.displayName,
                description: roleDef.description,
                sortOrder: roleDef.sortOrder,
                // Don't update isEnabled on existing records (preserve user changes)
            },
            create: roleDef,
        });
        console.log(`  ✓ ${roleDef.role} → ${roleDef.displayName}`);
    }

    console.log('✅ Role Settings seeded successfully!');
}

seedRoleSettings()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
