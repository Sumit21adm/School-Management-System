
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING DB CONSISTENCY FIX ---');

    // 1. Create school_classes table if not exists (using raw query for safety)
    try {
        console.log('Creating school_classes table...');
        await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS school_classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(20) UNIQUE NOT NULL,
        displayName VARCHAR(50) NOT NULL,
        \`order\` INT DEFAULT 0,
        capacity INT NULL,
        isActive BOOLEAN DEFAULT true,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `;
        console.log('✅ Table school_classes created/verified.');
    } catch (error) {
        console.error('❌ Error creating table:', error);
    }

    // 2. Seed Classes from Students
    try {
        console.log('Seeding classes from student data...');
        // Get distinct class names from students
        const students = await prisma.studentDetails.findMany({
            select: { className: true },
            distinct: ['className']
        });

        const classNames = students.map(s => s.className).filter(Boolean);
        console.log(`Found ${classNames.length} distinct classes:`, classNames);

        for (const className of classNames) {
            // Determine simpler display name or order if possible
            // Logic: Try to parse number for order, else put at end
            let order = 100;
            const match = className.match(/\d+/);
            if (match) {
                order = parseInt(match[0], 10);
            } else if (className.toLowerCase().includes('lkg')) {
                order = -2;
            } else if (className.toLowerCase().includes('ukg')) {
                order = -1;
            } else if (className.toLowerCase().includes('nurs')) {
                order = -3;
            }

            await prisma.schoolClass.upsert({
                where: { name: className },
                update: {}, // Do nothing if exists
                create: {
                    name: className,
                    displayName: `Class ${className}`,
                    order: order,
                    isActive: true
                }
            });
        }
        console.log('✅ Classes seeded successfully.');
    } catch (error) {
        console.error('❌ Error seeding classes:', error);
    }

    // 3. Fix Duplicate Sessions
    try {
        console.log('Checking for duplicate sessions...');
        const sessions = await prisma.academicSession.findMany({
            orderBy: { createdAt: 'asc' }
        });

        // Strategy: Keep the one with most relations or the first created one if equal
        // Specifically looking for "APR 2025-MAR 2026" duplicates
        const duplicates = sessions.filter(s =>
            s.name.replace(/\s+/g, '').includes('APR2025-MAR2026')
        );

        if (duplicates.length > 1) {
            console.log(`Found ${duplicates.length} potential duplicates for 2025-2026 session.`);

            // Identify the "master" session (e.g., the active one or the one with ID used in other tables)
            // For safety, let's pick the one that is currently active, or the first one.
            let master = duplicates.find(s => s.isActive) || duplicates[0];
            const others = duplicates.filter(s => s.id !== master.id);

            console.log(`Master Session: ID ${master.id} (${master.name})`);

            for (const other of others) {
                console.log(`Processing duplicate: ID ${other.id} (${other.name})`);

                // Reassign generic relations if any exist (Students, Fees, etc.)
                // This is complex raw SQL usually, or multiple transaction updates.
                // For now, checks if there are students in the duplicate session
                const studentCount = await prisma.studentDetails.count({ where: { sessionId: other.id } });
                console.log(`  - Students in duplicate: ${studentCount}`);

                if (studentCount > 0) {
                    console.log(`  - Moving ${studentCount} students to master session...`);
                    await prisma.studentDetails.updateMany({
                        where: { sessionId: other.id },
                        data: { sessionId: master.id }
                    });
                }

                // Check transactions
                const txCount = await prisma.feeTransaction.count({ where: { sessionId: other.id } });
                if (txCount > 0) {
                    console.log(`  - Moving ${txCount} transactions to master session...`);
                    await prisma.feeTransaction.updateMany({
                        where: { sessionId: other.id },
                        data: { sessionId: master.id }
                    });
                }

                // Delete the duplicate if seemingly empty now
                try {
                    await prisma.academicSession.delete({ where: { id: other.id } });
                    console.log(`  - Duplicate session ID ${other.id} DELETED.`);
                } catch (delErr) {
                    console.error(`  - Could not delete session ${other.id} (might have other constraints):`, delErr.message);
                }
            }
        } else {
            console.log('No obvious duplicates found for 2025-2026.');
        }

        console.log('✅ Session cleanup checks completed.');

    } catch (error) {
        console.error('❌ Error cleaning sessions:', error);
    }

    console.log('--- DB CONSISTENCY FIX COMPLETED ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
