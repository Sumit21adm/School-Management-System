import { PrismaClient, UserRole, DiscountType, BillStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Helper to generate random student ID
function generateStudentId(index: number, year: number = 2024): string {
  return `STU${year}${String(index).padStart(4, '0')}`;
}

// Helper to get random element from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to generate receipt number
function generateReceiptNo(index: number): string {
  return `RCP${new Date().getFullYear()}${String(index).padStart(5, '0')}`;
}

// Helper to generate bill number
function generateBillNo(studentId: string, month: number, year: number): string {
  return `BILL-${studentId}-${year}${String(month).padStart(2, '0')}`;
}

async function main() {
  console.log('🚀 Starting comprehensive sample data seeding...\n');

  // ============================================
  // 1. USERS - Different roles
  // ============================================
  console.log('👤 Creating users with different roles...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = [
    { username: 'superadmin', name: 'Super Administrator', email: 'superadmin@school.com', role: UserRole.SUPER_ADMIN },
    { username: 'admin', name: 'School Admin', email: 'admin@school.com', role: UserRole.ADMIN },
    { username: 'accountant1', name: 'Rajesh Kumar', email: 'rajesh@school.com', role: UserRole.ACCOUNTANT },
    { username: 'accountant2', name: 'Anita Sharma', email: 'anita@school.com', role: UserRole.ACCOUNTANT },
    { username: 'teacher1', name: 'Dr. Priya Singh', email: 'priya@school.com', role: UserRole.TEACHER },
    { username: 'teacher2', name: 'Mr. Vikram Patel', email: 'vikram@school.com', role: UserRole.TEACHER },
    { username: 'teacher3', name: 'Mrs. Sunita Gupta', email: 'sunita@school.com', role: UserRole.TEACHER },
    { username: 'teacher4', name: 'Mr. Rahul Verma', email: 'rahul@school.com', role: UserRole.TEACHER },
    { username: 'teacher5', name: 'Ms. Kavita Joshi', email: 'kavita@school.com', role: UserRole.TEACHER },
    { username: 'coordinator', name: 'Mrs. Meena Saxena', email: 'meena@school.com', role: UserRole.COORDINATOR },
    { username: 'receptionist', name: 'Pooja Yadav', email: 'pooja@school.com', role: UserRole.RECEPTIONIST },
  ];

  const createdUsers: Record<string, any> = {};
  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: { ...user, password: hashedPassword, active: true },
    });
    createdUsers[user.username] = created;
  }
  console.log(`   ✅ Created ${users.length} users\n`);

  // ============================================
  // 2. CREATE TEACHER PROFILES
  // ============================================
  console.log('👨‍🏫 Creating teacher profiles...');
  const teacherProfiles = [
    { userId: createdUsers['teacher1'].id, qualification: 'Ph.D. Mathematics', experience: '15 years', specialization: 'Mathematics, Statistics' },
    { userId: createdUsers['teacher2'].id, qualification: 'M.Sc. Physics', experience: '10 years', specialization: 'Physics, Science' },
    { userId: createdUsers['teacher3'].id, qualification: 'M.A. English', experience: '12 years', specialization: 'English Literature' },
    { userId: createdUsers['teacher4'].id, qualification: 'M.Sc. Computer Science', experience: '8 years', specialization: 'Computer Science, IT' },
    { userId: createdUsers['teacher5'].id, qualification: 'M.A. Hindi', experience: '7 years', specialization: 'Hindi, Sanskrit' },
  ];

  for (const profile of teacherProfiles) {
    await prisma.teacherProfile.upsert({
      where: { userId: profile.userId },
      update: profile,
      create: profile,
    });
  }
  console.log(`   ✅ Created ${teacherProfiles.length} teacher profiles\n`);

  // ============================================
  // 3. FEE TYPES
  // ============================================
  console.log('💰 Creating fee types...');
  const feeTypes = [
    { name: 'Tuition Fee', description: 'Monthly tuition fee', isDefault: true, isRecurring: true, frequency: 'Monthly' },
    { name: 'Computer Fee', description: 'Computer lab charges', frequency: 'Monthly' },
    { name: 'Laboratory Fee', description: 'Science lab fee', frequency: 'Yearly' },
    { name: 'Exam Fee', description: 'Examination charges', frequency: 'Yearly' },
    { name: 'Library Fee', description: 'Library membership', frequency: 'Yearly' },
    { name: 'Sports Fee', description: 'Sports facilities', frequency: 'Yearly' },
    { name: 'Development Fee', description: 'Infrastructure development', frequency: 'Yearly' },
    { name: 'Late Fee', description: 'Late payment penalty', frequency: 'One-time' },
    { name: 'Dress Fee', description: 'School uniform', frequency: 'One-time' },
    { name: 'Caution Money', description: 'Refundable deposit', frequency: 'Refundable' },
    { name: 'Transport Fee', description: 'School bus service', frequency: 'Monthly' },
    { name: 'Activity Fee', description: 'Extra-curricular activities', frequency: 'Yearly' },
  ];

  const createdFeeTypes: Record<string, any> = {};
  for (const feeType of feeTypes) {
    const created = await prisma.feeType.upsert({
      where: { name: feeType.name },
      update: feeType,
      create: feeType,
    });
    createdFeeTypes[feeType.name] = created;
  }
  console.log(`   ✅ Created ${feeTypes.length} fee types\n`);

  // ============================================
  // 4. CLASSES AND SECTIONS
  // ============================================
  console.log('🏫 Creating classes and sections...');
  const classes = [
    { name: 'Mount 1', displayName: 'Mount 1 (Nursery)', order: 1 },
    { name: 'Mount 2', displayName: 'Mount 2 (LKG)', order: 2 },
    { name: 'Mount 3', displayName: 'Mount 3 (UKG)', order: 3 },
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

  const createdClasses: Record<string, any> = {};
  for (const cls of classes) {
    const created = await prisma.schoolClass.upsert({
      where: { name: cls.name },
      update: cls,
      create: { ...cls, capacity: 40 },
    });
    createdClasses[cls.name] = created;
  }

  // Create sections for each class
  const sectionNames = ['A', 'B'];
  const createdSections: Record<string, any> = {};
  for (const cls of Object.values(createdClasses)) {
    for (const section of sectionNames) {
      const key = `${cls.name}-${section}`;
      const created = await prisma.section.upsert({
        where: { classId_name: { classId: cls.id, name: section } },
        update: {},
        create: { classId: cls.id, name: section, capacity: 40, roomNo: `Room ${cls.order}${section}` },
      });
      createdSections[key] = created;
    }
  }
  console.log(`   ✅ Created ${classes.length} classes with ${Object.keys(createdSections).length} sections\n`);

  // ============================================
  // 5. SUBJECTS AND CLASS-SUBJECT MAPPING
  // ============================================
  console.log('📚 Creating subjects...');
  const subjects = [
    { name: 'Mathematics', code: 'MATH', description: 'Mathematics and Numerical Skills', color: '#3B82F6' },
    { name: 'Science', code: 'SCI', description: 'General Science', color: '#10B981' },
    { name: 'English', code: 'ENG', description: 'English Language and Literature', color: '#EF4444' },
    { name: 'Hindi', code: 'HIN', description: 'Hindi Language', color: '#F59E0B' },
    { name: 'Social Studies', code: 'SST', description: 'History, Geography, Civics', color: '#8B5CF6' },
    { name: 'Computer Science', code: 'CS', description: 'Computer and IT Skills', color: '#06B6D4' },
    { name: 'Physical Education', code: 'PE', description: 'Sports and Physical Activities', color: '#EC4899' },
    { name: 'Art & Craft', code: 'ART', description: 'Drawing and Creative Arts', color: '#F97316' },
    { name: 'Physics', code: 'PHY', description: 'Physics for senior classes', color: '#6366F1' },
    { name: 'Chemistry', code: 'CHEM', description: 'Chemistry for senior classes', color: '#14B8A6' },
    { name: 'Biology', code: 'BIO', description: 'Biology for senior classes', color: '#22C55E' },
  ];

  const createdSubjects: Record<string, any> = {};
  for (const subject of subjects) {
    const created = await prisma.subject.upsert({
      where: { code: subject.code },
      update: {},
      create: subject,
    });
    createdSubjects[subject.code] = created;
  }
  console.log(`   ✅ Created ${subjects.length} subjects\n`);

  // ============================================
  // 6. ACADEMIC SESSIONS
  // ============================================
  console.log('📅 Creating academic sessions...');
  const sessions = [
    { name: 'APR 2023-MAR 2024', startDate: new Date('2023-04-01'), endDate: new Date('2024-03-31'), isActive: false },
    { name: 'APR 2024-MAR 2025', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), isActive: true },
    { name: 'APR 2025-MAR 2026', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31'), isActive: false, isSetupMode: true },
  ];

  const createdSessions: Record<string, any> = {};
  for (const session of sessions) {
    const created = await prisma.academicSession.upsert({
      where: { name: session.name },
      update: {},
      create: session,
    });
    createdSessions[session.name] = created;
  }
  const activeSession = createdSessions['APR 2024-MAR 2025'];
  console.log(`   ✅ Created ${sessions.length} academic sessions\n`);

  // ============================================
  // 7. FEE STRUCTURES
  // ============================================
  console.log('📋 Creating fee structures...');
  const feeStructureData: { className: string; tuition: number; computer: number; lab: number }[] = [
    { className: 'Mount 1', tuition: 2000, computer: 300, lab: 0 },
    { className: 'Mount 2', tuition: 2200, computer: 300, lab: 0 },
    { className: 'Mount 3', tuition: 2500, computer: 400, lab: 0 },
    { className: '1', tuition: 3000, computer: 500, lab: 200 },
    { className: '2', tuition: 3000, computer: 500, lab: 200 },
    { className: '3', tuition: 3200, computer: 500, lab: 300 },
    { className: '4', tuition: 3200, computer: 500, lab: 300 },
    { className: '5', tuition: 3500, computer: 600, lab: 400 },
    { className: '6', tuition: 4000, computer: 700, lab: 500 },
    { className: '7', tuition: 4000, computer: 700, lab: 500 },
    { className: '8', tuition: 4500, computer: 800, lab: 600 },
    { className: '9', tuition: 5000, computer: 900, lab: 700 },
    { className: '10', tuition: 5500, computer: 1000, lab: 800 },
    { className: '11', tuition: 6000, computer: 1200, lab: 1000 },
    { className: '12', tuition: 6500, computer: 1200, lab: 1000 },
  ];

  for (const fs of feeStructureData) {
    const structure = await prisma.feeStructure.upsert({
      where: { sessionId_className: { sessionId: activeSession.id, className: fs.className } },
      update: {},
      create: { sessionId: activeSession.id, className: fs.className, description: `Fee structure for ${fs.className}` },
    });

    // Add fee items
    const feeItems = [
      { feeTypeId: createdFeeTypes['Tuition Fee'].id, amount: fs.tuition, frequency: 'Monthly' },
      { feeTypeId: createdFeeTypes['Computer Fee'].id, amount: fs.computer, frequency: 'Monthly' },
      { feeTypeId: createdFeeTypes['Laboratory Fee'].id, amount: fs.lab, frequency: 'Yearly' },
      { feeTypeId: createdFeeTypes['Exam Fee'].id, amount: 500, frequency: 'Yearly' },
      { feeTypeId: createdFeeTypes['Library Fee'].id, amount: 300, frequency: 'Yearly' },
      { feeTypeId: createdFeeTypes['Sports Fee'].id, amount: 400, frequency: 'Yearly' },
    ];

    for (const item of feeItems) {
      if (item.amount > 0) {
        await prisma.feeStructureItem.upsert({
          where: { structureId_feeTypeId: { structureId: structure.id, feeTypeId: item.feeTypeId } },
          update: { amount: item.amount },
          create: { structureId: structure.id, ...item },
        });
      }
    }
  }
  console.log(`   ✅ Created fee structures for ${feeStructureData.length} classes\n`);

  // ============================================
  // 8. STUDENTS WITH DIVERSE SCENARIOS
  // ============================================
  console.log('🎓 Creating students with diverse scenarios...');
  
  const indianFirstNames = ['Aarav', 'Vivaan', 'Aditya', 'Ananya', 'Diya', 'Ishaan', 'Kavya', 'Arjun', 'Priya', 'Rohan', 'Sanya', 'Vihaan', 'Isha', 'Reyansh', 'Kiara', 'Arnav', 'Myra', 'Krishna', 'Aadhya', 'Dhruv'];
  const indianLastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Joshi', 'Mishra', 'Agarwal', 'Yadav', 'Mehta', 'Saxena', 'Kapoor', 'Chauhan', 'Reddy'];
  const categories = ['General', 'OBC', 'SC', 'ST', 'EWS'];
  const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain'];

  const studentsToCreate: any[] = [];
  let studentIndex = 1;

  // Create students for each class (5-10 per class)
  for (const className of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']) {
    const studentsPerClass = Math.floor(Math.random() * 6) + 5; // 5-10 students
    
    for (let i = 0; i < studentsPerClass; i++) {
      const firstName = randomItem(indianFirstNames);
      const lastName = randomItem(indianLastNames);
      const gender = Math.random() > 0.5 ? 'Male' : 'Female';
      const section = Math.random() > 0.5 ? 'A' : 'B';
      
      studentsToCreate.push({
        studentId: generateStudentId(studentIndex++),
        name: `${firstName} ${lastName}`,
        fatherName: `Mr. ${randomItem(indianFirstNames)} ${lastName}`,
        motherName: `Mrs. ${randomItem(indianFirstNames)} ${lastName}`,
        dob: faker.date.between({ from: new Date('2010-01-01'), to: new Date('2018-12-31') }),
        gender,
        className,
        section,
        rollNumber: String(i + 1),
        admissionDate: faker.date.between({ from: new Date('2020-01-01'), to: new Date('2024-06-30') }),
        address: faker.location.streetAddress() + ', ' + faker.location.city(),
        phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        status: 'active',
        category: randomItem(categories),
        religion: randomItem(religions),
        fatherOccupation: randomItem(['Business', 'Service', 'Teacher', 'Doctor', 'Engineer', 'Farmer']),
        motherOccupation: randomItem(['Homemaker', 'Teacher', 'Doctor', 'Business', 'Engineer']),
        sessionId: activeSession.id,
      });
    }
  }

  // Add some special scenario students
  // 1. Inactive/Left student
  studentsToCreate.push({
    studentId: generateStudentId(studentIndex++),
    name: 'Rahul Sharma (Left)',
    fatherName: 'Mr. Suresh Sharma',
    motherName: 'Mrs. Rekha Sharma',
    dob: new Date('2012-05-15'),
    gender: 'Male',
    className: '5',
    section: 'A',
    rollNumber: '99',
    admissionDate: new Date('2020-04-01'),
    address: '123 Old Street, Mumbai',
    phone: '9876543210',
    status: 'left', // Student who left
    category: 'General',
    sessionId: activeSession.id,
  });

  // 2. Student with pending dues (will add dues later)
  studentsToCreate.push({
    studentId: generateStudentId(studentIndex++),
    name: 'Amit Singh (Dues)',
    fatherName: 'Mr. Raj Singh',
    motherName: 'Mrs. Priya Singh',
    dob: new Date('2013-08-20'),
    gender: 'Male',
    className: '4',
    section: 'B',
    rollNumber: '25',
    admissionDate: new Date('2021-04-01'),
    address: '456 New Road, Delhi',
    phone: '9876543211',
    status: 'active',
    category: 'OBC',
    sessionId: activeSession.id,
  });

  for (const student of studentsToCreate) {
    await prisma.studentDetails.upsert({
      where: { studentId: student.studentId },
      update: {},
      create: student,
    });
  }

  const allStudents = await prisma.studentDetails.findMany({ where: { status: 'active' } });
  console.log(`   ✅ Created ${studentsToCreate.length} students (${allStudents.length} active)\n`);

  // ============================================
  // 9. STUDENT FEE DISCOUNTS
  // ============================================
  console.log('🎁 Creating student discounts...');
  
  // Give discounts to some students
  const discountStudents = allStudents.slice(0, 10);
  for (const student of discountStudents) {
    await prisma.studentFeeDiscount.upsert({
      where: { studentId_feeTypeId_sessionId: { 
        studentId: student.studentId, 
        feeTypeId: createdFeeTypes['Tuition Fee'].id, 
        sessionId: activeSession.id 
      }},
      update: {},
      create: {
        studentId: student.studentId,
        feeTypeId: createdFeeTypes['Tuition Fee'].id,
        sessionId: activeSession.id,
        discountType: Math.random() > 0.5 ? DiscountType.PERCENTAGE : DiscountType.FIXED,
        discountValue: Math.random() > 0.5 ? 10 : 500, // 10% or Rs 500
        reason: randomItem(['Sibling discount', 'Merit scholarship', 'Staff ward', 'EWS category', 'Early payment']),
        approvedBy: 'Principal',
      },
    });
  }
  console.log(`   ✅ Created discounts for ${discountStudents.length} students\n`);

  // ============================================
  // 10. FEE TRANSACTIONS (PAYMENTS)
  // ============================================
  console.log('💳 Creating fee transactions...');
  
  let transactionIndex = 1;
  const paymentModes = ['Cash', 'UPI', 'Card', 'NetBanking', 'Cheque'];
  const collectors = ['Rajesh Kumar', 'Anita Sharma', 'Pooja Yadav'];

  // Create transactions for most active students
  for (const student of allStudents.slice(0, Math.floor(allStudents.length * 0.8))) {
    // Create 2-4 transactions per student for different months
    const numTransactions = Math.floor(Math.random() * 3) + 2;
    
    for (let month = 4; month < 4 + numTransactions && month <= 12; month++) {
      const transaction = await prisma.feeTransaction.create({
        data: {
          transactionId: `TXN${Date.now()}${transactionIndex}`,
          studentId: student.studentId,
          sessionId: activeSession.id,
          receiptNo: generateReceiptNo(transactionIndex++),
          amount: 3500 + Math.floor(Math.random() * 2000),
          description: `Fee payment for ${['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month - 4]} 2024`,
          paymentMode: randomItem(paymentModes),
          date: new Date(2024, month - 1, Math.floor(Math.random() * 25) + 1),
          yearId: 2024,
          collectedBy: randomItem(collectors),
          remarks: Math.random() > 0.7 ? 'Partial payment' : null,
        },
      });

      // Add payment details
      await prisma.feePaymentDetail.create({
        data: {
          transactionId: transaction.id,
          feeTypeId: createdFeeTypes['Tuition Fee'].id,
          amount: 3000 + Math.floor(Math.random() * 1000),
          discountAmount: Math.random() > 0.8 ? 300 : 0,
          netAmount: 3000,
        },
      });
    }
  }
  console.log(`   ✅ Created ${transactionIndex - 1} fee transactions\n`);

  // ============================================
  // 11. DEMAND BILLS
  // ============================================
  console.log('📄 Creating demand bills...');
  
  let billIndex = 1;
  for (const student of allStudents.slice(0, 30)) {
    // Create bills for past months
    for (let month = 4; month <= 10; month++) {
      const isPaid = Math.random() > 0.3;
      const totalAmount = 3500 + Math.floor(Math.random() * 1500);
      
      await prisma.demandBill.upsert({
        where: { studentId_sessionId_month_year: {
          studentId: student.studentId,
          sessionId: activeSession.id,
          month,
          year: 2024
        }},
        update: {},
        create: {
          billNo: generateBillNo(student.studentId, month, 2024),
          studentId: student.studentId,
          sessionId: activeSession.id,
          month,
          year: 2024,
          billDate: new Date(2024, month - 1, 1),
          dueDate: new Date(2024, month - 1, 10),
          totalAmount,
          previousDues: month > 4 && Math.random() > 0.7 ? 500 : 0,
          lateFee: Math.random() > 0.8 ? 100 : 0,
          discount: Math.random() > 0.8 ? 200 : 0,
          netAmount: totalAmount,
          paidAmount: isPaid ? totalAmount : (Math.random() > 0.5 ? totalAmount / 2 : 0),
          status: isPaid ? BillStatus.PAID : (Math.random() > 0.5 ? BillStatus.PARTIALLY_PAID : BillStatus.PENDING),
          sentDate: new Date(2024, month - 1, 1),
          paidDate: isPaid ? new Date(2024, month - 1, Math.floor(Math.random() * 10) + 5) : null,
        },
      });
    }
  }
  console.log(`   ✅ Created demand bills for 30 students\n`);

  // ============================================
  // 12. EXAM TYPES AND EXAMS
  // ============================================
  console.log('📝 Creating exam types and exams...');
  
  const examTypes = [
    { name: 'Unit Test', description: 'Monthly unit tests' },
    { name: 'Half Yearly', description: 'Half yearly examination' },
    { name: 'Annual Exam', description: 'Final annual examination' },
    { name: 'Pre-Board', description: 'Pre-board for Class 10 & 12' },
  ];

  const createdExamTypes: Record<string, any> = {};
  for (const et of examTypes) {
    const created = await prisma.examType.upsert({
      where: { name: et.name },
      update: {},
      create: et,
    });
    createdExamTypes[et.name] = created;
  }

  // Create exams
  const exams = [
    { name: 'Unit Test 1 - April 2024', examTypeId: createdExamTypes['Unit Test'].id, startDate: new Date('2024-04-15'), endDate: new Date('2024-04-20'), status: 'COMPLETED' },
    { name: 'Unit Test 2 - July 2024', examTypeId: createdExamTypes['Unit Test'].id, startDate: new Date('2024-07-10'), endDate: new Date('2024-07-15'), status: 'COMPLETED' },
    { name: 'Half Yearly Exam 2024', examTypeId: createdExamTypes['Half Yearly'].id, startDate: new Date('2024-09-20'), endDate: new Date('2024-10-05'), status: 'COMPLETED' },
    { name: 'Unit Test 3 - November 2024', examTypeId: createdExamTypes['Unit Test'].id, startDate: new Date('2024-11-15'), endDate: new Date('2024-11-20'), status: 'ONGOING' },
    { name: 'Annual Exam 2025', examTypeId: createdExamTypes['Annual Exam'].id, startDate: new Date('2025-02-15'), endDate: new Date('2025-03-10'), status: 'UPCOMING' },
  ];

  for (const exam of exams) {
    await prisma.exam.create({
      data: { ...exam, sessionId: activeSession.id },
    });
  }
  console.log(`   ✅ Created ${examTypes.length} exam types and ${exams.length} exams\n`);

  // ============================================
  // 13. PRINT SETTINGS
  // ============================================
  console.log('🖨️ Creating print settings...');
  
  await prisma.printSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      schoolName: 'Sunshine Public School',
      schoolAddress: '123 Education Lane, Knowledge City, State - 110001',
      phone: '011-12345678',
      email: 'info@sunshineschool.edu',
      website: 'www.sunshineschool.edu',
      tagline: 'Nurturing Minds, Building Futures',
      affiliationNo: 'CBSE/AFF/2010/123456',
      affiliationNote: 'Affiliated to CBSE, New Delhi',
      demandBillNote: 'Please pay by due date to avoid late fee. Fee once paid is non-refundable.',
      feeReceiptNote: 'This is a computer-generated receipt and does not require signature.',
    },
  });
  console.log('   ✅ Created print settings\n');

  // ============================================
  // 14. CLASS TEACHER ASSIGNMENTS
  // ============================================
  console.log('👨‍🏫 Creating class teacher assignments...');
  
  const teacherIds = [
    createdUsers['teacher1'].id,
    createdUsers['teacher2'].id,
    createdUsers['teacher3'].id,
    createdUsers['teacher4'].id,
    createdUsers['teacher5'].id,
  ];

  let teacherIndex = 0;
  for (const className of ['5', '6', '7', '8', '9']) {
    const section = createdSections[`${className}-A`];
    if (section) {
      await prisma.classTeacherAssignment.upsert({
        where: { sectionId_sessionId_isPrimary: { sectionId: section.id, sessionId: activeSession.id, isPrimary: true } },
        update: {},
        create: {
          sectionId: section.id,
          teacherId: teacherIds[teacherIndex % teacherIds.length],
          sessionId: activeSession.id,
          isPrimary: true,
        },
      });
      teacherIndex++;
    }
  }
  console.log('   ✅ Created class teacher assignments\n');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n🎉 Sample data seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - ${users.length} Users (Admin, Teachers, Accountants, etc.)`);
  console.log(`   - ${teacherProfiles.length} Teacher profiles`);
  console.log(`   - ${feeTypes.length} Fee types`);
  console.log(`   - ${classes.length} Classes with ${Object.keys(createdSections).length} sections`);
  console.log(`   - ${subjects.length} Subjects`);
  console.log(`   - ${sessions.length} Academic sessions`);
  console.log(`   - ${feeStructureData.length} Fee structures`);
  console.log(`   - ${studentsToCreate.length} Students (various scenarios)`);
  console.log(`   - ${discountStudents.length} Students with discounts`);
  console.log(`   - ${transactionIndex - 1} Fee transactions`);
  console.log(`   - Demand bills for 30 students`);
  console.log(`   - ${examTypes.length} Exam types and ${exams.length} exams`);
  console.log(`   - Print settings configured`);
  console.log(`   - Class teacher assignments`);
  console.log('\n🔐 Login Credentials:');
  console.log('   All users: password = "password123"');
  console.log('   Super Admin: superadmin / password123');
  console.log('   Admin: admin / password123');
  console.log('   Accountant: accountant1 / password123');
  console.log('   Teacher: teacher1 / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
