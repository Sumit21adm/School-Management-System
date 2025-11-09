import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { code: 'demo-school' },
    update: {},
    create: {
      name: 'Demo School',
      code: 'demo-school',
      plan: 'pro',
      status: 'active',
      domain: 'demo.schoolms.local',
    },
  });

  console.log('✅ Created tenant:', tenant.name);

  // Create default permissions
  const permissions = [
    // User Management
    { key: 'users:create', module: 'users', action: 'create', description: 'Create users' },
    { key: 'users:read', module: 'users', action: 'read', description: 'View users' },
    { key: 'users:update', module: 'users', action: 'update', description: 'Update users' },
    { key: 'users:delete', module: 'users', action: 'delete', description: 'Delete users' },
    
    // Student Management
    { key: 'students:create', module: 'students', action: 'create', description: 'Create students' },
    { key: 'students:read', module: 'students', action: 'read', description: 'View students' },
    { key: 'students:update', module: 'students', action: 'update', description: 'Update students' },
    { key: 'students:delete', module: 'students', action: 'delete', description: 'Delete students' },
    
    // Attendance
    { key: 'attendance:create', module: 'attendance', action: 'create', description: 'Mark attendance' },
    { key: 'attendance:read', module: 'attendance', action: 'read', description: 'View attendance' },
    
    // Fees
    { key: 'fees:create', module: 'fees', action: 'create', description: 'Create fee plans' },
    { key: 'fees:read', module: 'fees', action: 'read', description: 'View fees' },
    { key: 'fees:update', module: 'fees', action: 'update', description: 'Update fees' },
    
    // Exams
    { key: 'exams:create', module: 'exams', action: 'create', description: 'Create exams' },
    { key: 'exams:read', module: 'exams', action: 'read', description: 'View exams' },
    { key: 'exams:update', module: 'exams', action: 'update', description: 'Update exams' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: perm,
    });
  }

  console.log('✅ Created', permissions.length, 'permissions');

  // Create roles
  const superAdminRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Super Admin' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Super Admin',
      description: 'Full system access',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'School Admin' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'School Admin',
      description: 'School administrator with full access',
    },
  });

  const teacherRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Teacher' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Teacher',
      description: 'Teaching staff',
    },
  });

  const studentRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Student' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Student',
      description: 'Student access',
    },
  });

  console.log('✅ Created roles');

  // Assign all permissions to Super Admin and School Admin
  const allPermissions = await prisma.permission.findMany();
  
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Assigned permissions to roles');

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@school.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@school.com',
      phone: '+1234567890',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      status: 'active',
    },
  });

  // Assign admin role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Created admin user: admin@school.com / admin123');

  // Create school
  const school = await prisma.school.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Demo School',
      code: 'DEMO',
      address: '123 Education Street, Demo City',
      phone: '+1234567890',
      email: 'info@demoschool.com',
    },
  });

  console.log('✅ Created school:', school.name);

  // Create main campus
  const campus = await prisma.campus.create({
    data: {
      tenantId: tenant.id,
      schoolId: school.id,
      name: 'Main Campus',
      address: '123 Education Street, Demo City',
      phone: '+1234567890',
    },
  });

  console.log('✅ Created campus:', campus.name);

  // Create academic year
  const academicYear = await prisma.academicYear.create({
    data: {
      tenantId: tenant.id,
      name: '2024-2025',
      startDate: new Date('2024-08-01'),
      endDate: new Date('2025-07-31'),
      isActive: true,
    },
  });

  console.log('✅ Created academic year:', academicYear.name);

  // Create classes
  const classes = [
    { name: 'Grade 1', gradeLevel: 1 },
    { name: 'Grade 2', gradeLevel: 2 },
    { name: 'Grade 3', gradeLevel: 3 },
    { name: 'Grade 4', gradeLevel: 4 },
    { name: 'Grade 5', gradeLevel: 5 },
    { name: 'Grade 6', gradeLevel: 6 },
    { name: 'Grade 7', gradeLevel: 7 },
    { name: 'Grade 8', gradeLevel: 8 },
    { name: 'Grade 9', gradeLevel: 9 },
    { name: 'Grade 10', gradeLevel: 10 },
  ];

  for (const classData of classes) {
    await prisma.class.create({
      data: {
        tenantId: tenant.id,
        name: classData.name,
        gradeLevel: classData.gradeLevel,
      },
    });
  }

  console.log('✅ Created', classes.length, 'classes');

  // Create sections for Grade 1
  const grade1 = await prisma.class.findFirst({
    where: { tenantId: tenant.id, name: 'Grade 1' },
  });

  if (grade1) {
    const sections = ['A', 'B', 'C'];
    for (const sectionName of sections) {
      await prisma.section.create({
        data: {
          tenantId: tenant.id,
          classId: grade1.id,
          campusId: campus.id,
          name: sectionName,
          capacity: 40,
        },
      });
    }
    console.log('✅ Created 3 sections for Grade 1');
  }

  // Create subjects
  const subjects = [
    { code: 'MATH', name: 'Mathematics', credit: 4 },
    { code: 'ENG', name: 'English', credit: 4 },
    { code: 'SCI', name: 'Science', credit: 4 },
    { code: 'SOC', name: 'Social Studies', credit: 3 },
    { code: 'PE', name: 'Physical Education', credit: 2 },
    { code: 'ART', name: 'Arts', credit: 2 },
  ];

  for (const subjectData of subjects) {
    await prisma.subject.create({
      data: {
        tenantId: tenant.id,
        code: subjectData.code,
        name: subjectData.name,
        credit: subjectData.credit,
      },
    });
  }

  console.log('✅ Created', subjects.length, 'subjects');

  // Create fee heads
  const feeHeads = [
    { name: 'Tuition Fee', description: 'Monthly tuition fee' },
    { name: 'Activity Fee', description: 'Extra-curricular activities' },
    { name: 'Library Fee', description: 'Library access and books' },
    { name: 'Transport Fee', description: 'School transportation' },
    { name: 'Exam Fee', description: 'Examination charges' },
  ];

  for (const feeHead of feeHeads) {
    await prisma.feeHead.create({
      data: {
        tenantId: tenant.id,
        name: feeHead.name,
        description: feeHead.description,
      },
    });
  }

  console.log('✅ Created', feeHeads.length, 'fee heads');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: admin@school.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
