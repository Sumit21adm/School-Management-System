import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper to get random item from array
const random = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
    console.log('🏫 Starting Class Management Seeding...');

    // 1. Get Session & Classes
    const session = await prisma.academicSession.findFirst({
        where: { isActive: true },
    });
    if (!session) throw new Error('Active Academic Session not found');

    const classes = await prisma.schoolClass.findMany({
        orderBy: { order: 'asc' },
    });
    if (classes.length === 0) throw new Error('Classes not found');

    // 2. Create Classes (if not exist) & Assign Subjects
    console.log('Assigning Subjects to Classes...');
    const allSubjects = await prisma.subject.findMany();

    // Default subject assignment for all classes
    for (const cls of classes) {
        for (const sub of allSubjects) {
            await prisma.classSubject.upsert({
                where: {
                    classId_subjectId: {
                        classId: cls.id,
                        subjectId: sub.id
                    }
                },
                update: {},
                create: {
                    classId: cls.id,
                    subjectId: sub.id,
                    isCompulsory: true,
                    weeklyPeriods: 4,
                    order: 1
                }
            });
        }
    }

    // 2. Create Sections
    console.log('Creating Sections...');
    const sections: any[] = [];
    for (const cls of classes) {
        // 2 Sections per class: A and B
        for (const sectionName of ['A', 'B']) {
            const section = await prisma.section.upsert({
                where: {
                    classId_name: {
                        classId: cls.id,
                        name: sectionName
                    }
                },
                update: {},
                create: {
                    classId: cls.id,
                    name: sectionName,
                    roomNo: `${100 + cls.order}${sectionName}`,
                    capacity: 40
                }
            });
            sections.push(section);
        }
    }

    // 3. Create Teachers
    console.log('Creating Teachers...');
    const subjects = await prisma.subject.findMany();
    const teachers: any[] = [];
    const hashedPassword = await bcrypt.hash('teacher123', 10);

    for (let i = 0; i < 20; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const username = `teacher${i + 1}`;

        // Create User
        const user = await prisma.user.upsert({
            where: { username },
            update: {},
            create: {
                username,
                password: hashedPassword,
                name: `${firstName} ${lastName}`,
                email: faker.internet.email({ firstName, lastName }),
                role: 'TEACHER',
                active: true,
            }
        });

        // Create Teacher Profile
        await prisma.teacherProfile.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                qualification: random(['B.Ed', 'M.Ed', 'PhD', 'M.Sc', 'M.A']),
                experience: `${Math.floor(Math.random() * 10) + 1} Years`,
                specialization: random(subjects).name
            }
        });

        teachers.push(user);
    }

    // 4. Assign Class Teachers
    console.log('Assigning Class Teachers...');
    let teacherIndex = 0;
    for (const section of sections) {
        const teacher = teachers[teacherIndex % teachers.length];

        await prisma.classTeacherAssignment.upsert({
            where: {
                sectionId_sessionId_isPrimary: {
                    sectionId: section.id,
                    sessionId: session.id,
                    isPrimary: true
                }
            },
            update: {},
            create: {
                sectionId: section.id,
                sessionId: session.id,
                teacherId: teacher.id,
                isPrimary: true
            }
        });

        teacherIndex++;
    }

    // 5. Subject Allocation (Simplified)
    console.log('Allocating Subject Teachers...');
    for (const section of sections) {
        // Get class subjects
        const classSubjects = await prisma.classSubject.findMany({
            where: { classId: section.classId },
            include: { subject: true }
        });

        for (const cs of classSubjects) {
            // Pick a random teacher
            const teacher = random(teachers);

            await prisma.subjectTeacherAllocation.upsert({
                where: {
                    sectionId_subjectId_sessionId: {
                        sectionId: section.id,
                        subjectId: cs.subjectId,
                        sessionId: session.id
                    }
                },
                update: {},
                create: {
                    sectionId: section.id,
                    subjectId: cs.subjectId,
                    sessionId: session.id,
                    teacherId: teacher.id
                }
            });
        }
    }

    // 6. Generate Dummy Routine (Sample for one section)
    console.log('Generating Routine for first section...');
    const sampleSection = sections[0];
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];

    // Get Class Subjects again
    const classSubjects = await prisma.classSubject.findMany({
        where: { classId: sampleSection.classId },
    });

    if (classSubjects.length > 0) {
        for (const day of days) {
            for (const period of periods) {
                // Random subject
                const cs = random(classSubjects);
                // Find allocation to get the teacher
                const allocation = await prisma.subjectTeacherAllocation.findUnique({
                    where: {
                        sectionId_subjectId_sessionId: {
                            sectionId: sampleSection.id,
                            subjectId: cs.subjectId,
                            sessionId: session.id
                        }
                    }
                });

                if (allocation) {
                    await prisma.classRoutine.upsert({
                        where: {
                            sectionId_sessionId_dayOfWeek_periodNo: {
                                sectionId: sampleSection.id,
                                sessionId: session.id,
                                dayOfWeek: day,
                                periodNo: period
                            }
                        },
                        update: {},
                        create: {
                            sectionId: sampleSection.id,
                            sessionId: session.id,
                            dayOfWeek: day,
                            periodNo: period,
                            subjectId: cs.subjectId,
                            teacherId: allocation.teacherId,
                            startTime: `${8 + period}:00`, // Simplified time
                            endTime: `${8 + period}:45`
                        }
                    });
                }
            }
        }
    }

    console.log('✅ Class Management data seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
