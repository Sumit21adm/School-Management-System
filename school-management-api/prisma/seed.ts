import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'System Administrator',
      email: 'admin@school.com',
      role: 'admin',
      active: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);
  console.log('   Username: admin');
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

  const createdFeeTypes: any = {};
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

  console.log('✅ Fee types created');

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

  // Create sample students (30 students across classes 1-12)
  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sections = ['A', 'B'];
  const firstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Arjun', 'Ananya', 'Rohan', 'Kavya', 'Aditya', 'Diya'];
  const lastNames = ['Sharma', 'Kumar', 'Singh', 'Patel', 'Verma', 'Gupta', 'Reddy', 'Rao', 'Joshi', 'Nair'];

  let studentCount = 0;
  for (let i = 0; i < 30; i++) {
    const className = classes[Math.floor(i / 2.5)];
    const section = sections[i % 2];
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / 3) % lastNames.length];
    const name = `${firstName} ${lastName}`;

    await prisma.studentDetails.create({
      data: {
        studentId: `D-2024${String(1000 + i).padStart(4, '0')}`,
        name,
        dob: new Date(2010 + Math.floor(i / 3), (i % 12), 15),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        fatherName: `${lastNames[i % lastNames.length]} (Father)`,
        motherName: `Mrs. ${lastNames[i % lastNames.length]}`,
        phone: `98${String(10000000 + i).substring(0, 8)}`,
        address: `${i + 1}, Sample Street, City - 110001`,
        className,
        section,
        sessionId: session.id,
        admissionDate: new Date('2024-04-01'),
        status: 'active',
      },
    });
    studentCount++;
  }

  console.log(`✅ Created ${studentCount} sample students`);

  // Create fee structures for all classes
  const monthlyFees = {
    '1': 2000, '2': 2200, '3': 2500, '4': 2700, '5': 3000, '6': 3200,
    '7': 3500, '8': 3700, '9': 4000, '10': 4200, '11': 4500, '12': 4500
  };

  for (const className of classes) {
    const baseFee = monthlyFees[className as keyof typeof monthlyFees];

    await prisma.feeStructure.create({
      data: {
        sessionId: session.id,
        className,
        feeItems: {
          create: [
            { feeTypeId: createdFeeTypes['Tuition Fee'].id, amount: baseFee },
            { feeTypeId: createdFeeTypes['Computer Fee'].id, amount: 300 },
            { feeTypeId: createdFeeTypes['Laboratory Fee'].id, amount: 1500 },
            { feeTypeId: createdFeeTypes['Exam Fee'].id, amount: 250 },
            { feeTypeId: createdFeeTypes['Library Fee'].id, amount: 800 },
            { feeTypeId: createdFeeTypes['Sports Fee'].id, amount: 200 },
            { feeTypeId: createdFeeTypes['Miscellaneous Fee'].id, amount: 150 },
            { feeTypeId: createdFeeTypes['Development Fee'].id, amount: 2000 },
            { feeTypeId: createdFeeTypes['Late Fee'].id, amount: 100 }, // ₹100 fixed late fee
          ],
        },
      },
    });
  }

  console.log('✅ Fee structures created for all classes');

  console.log('\n🎉 Sample data seeding completed successfully!');
  console.log('📊 Summary:');
  console.log('   - 1 Admin user');
  console.log('   - 12 Fee types');
  console.log('   - 1 Academic session');
  console.log(`   - ${studentCount} Students`);
  console.log('   - 12 Fee structures (one per class)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
