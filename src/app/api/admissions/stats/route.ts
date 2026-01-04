
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        // Run queries in parallel
        const [active, alumni, archived, birthdayCount] = await Promise.all([
            prisma.studentDetails.count({ where: { status: 'active' } }),
            prisma.studentDetails.count({ where: { status: 'alumni' } }),
            prisma.studentDetails.count({ where: { status: 'archived' } }),
            // Safe raw query for birthdays to handle date functions across DBs, but Prisma doesn't support easy date extraction in count.
            // We'll fetch students with matching month/day. 
            // Actually, for MySQL: MONTH(dob) = m AND DAY(dob) = d
            prisma.$queryRaw`
                SELECT COUNT(*) as count 
                FROM student_details 
                WHERE MONTH(dob) = ${month} AND DAY(dob) = ${day} AND status = 'active'
            `
        ]);

        // Parse BigInt from raw query
        const bdayCount = Number((birthdayCount as any)[0].count);

        return NextResponse.json({
            stats: {
                active,
                alumni,
                archived,
                birthdayCount: bdayCount
            }
        });
    } catch (error) {
        console.error('Error fetching admission stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch admission stats' },
            { status: 500 }
        );
    }
}
