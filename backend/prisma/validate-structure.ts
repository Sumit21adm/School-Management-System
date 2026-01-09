import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🏗️ Starting Fee Structure Consistency Check...');

    // 1. Get active session
    const session = await prisma.academicSession.findFirst({
        where: { isActive: true },
    });
    if (!session) throw new Error('No active session found');

    // 2. Get all students in active session
    const students = await prisma.studentDetails.findMany({
        where: { sessionId: session.id },
        select: { studentId: true, className: true }
    });

    console.log(`Checking ${students.length} students against Fee Structures...`);

    let discrepancies = 0;
    // Cache structures to avoid N+1 queries
    const structures = await prisma.feeStructure.findMany({
        where: { sessionId: session.id }
    });
    const structureMap = new Set(structures.map(s => s.className));

    for (const student of students) {
        if (!structureMap.has(student.className)) {
            console.error(`❌ Student ${student.studentId} in Class ${student.className} has NO Fee Structure defined!`);
            discrepancies++;
        }
    }

    // 3. Reverse Check: Are there Fee Structures for empty classes?
    const studentClasses = new Set(students.map(s => s.className));
    for (const struct of structures) {
        if (!studentClasses.has(struct.className)) {
            console.warn(`⚠️ Warning: Fee Structure exists for Class ${struct.className}, but no students are enrolled.`);
        }
    }

    if (discrepancies === 0) {
        console.log('✅ Fee Structure Check Passed: All students have valid fee structures.');
    } else {
        console.error(`⚠️ Found ${discrepancies} students without fee structures.`);
        process.exit(1);
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
