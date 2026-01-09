import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- classes ---');
    const classes = await prisma.schoolClass.findMany();
    classes.forEach(c => console.log(`Class: id=${c.id}, name='${c.name}', displayName='${c.displayName}'`));

    console.log('\n--- sections ---');
    const sections = await prisma.section.findMany({
        include: { class: true }
    });
    sections.forEach(s => console.log(`Section: id=${s.id}, name='${s.name}', classId=${s.classId} (Class: '${s.class.name}')`));

    console.log('\n--- students (first 10) ---');
    const students = await prisma.studentDetails.findMany({
        take: 10,
        select: { id: true, name: true, className: true, section: true }
    });
    students.forEach(s => console.log(`Student: id=${s.id}, name='${s.name}', className='${s.className}', section='${s.section}'`));

    console.log('\n--- Finding Students for Class="Mount 1" Section="A" ---');
    const match = await prisma.studentDetails.findMany({
        where: {
            className: 'Mount 1',
            section: 'A',
            status: 'active'
        }
    });
    console.log(`Found ${match.length} students matching className='Mount 1' and section='A'`);

    // Check with '1' just in case
    const match2 = await prisma.studentDetails.findMany({
        where: {
            className: '1',
            section: 'A',
            status: 'active'
        }
    });
    console.log(`Found ${match2.length} students matching className='1' and section='A'`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
