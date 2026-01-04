import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST import students from CSV data
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { students, sessionId } = body;

        if (!students || !Array.isArray(students) || students.length === 0) {
            return NextResponse.json({ error: 'students array is required' }, { status: 400 });
        }

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
        }

        const results = {
            success: true,
            imported: 0,
            failed: 0,
            errors: [] as { row: number; name: string; reason: string }[],
        };

        // Get current year for student ID generation
        const currentYear = new Date().getFullYear();
        const lastStudent = await prisma.studentDetails.findFirst({
            where: { studentId: { startsWith: `STU${currentYear}` } },
            orderBy: { studentId: 'desc' },
        });

        let nextNumber = 1;
        if (lastStudent) {
            const lastNumber = parseInt(lastStudent.studentId.slice(-4));
            nextNumber = lastNumber + 1;
        }

        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            try {
                // Validate required fields
                if (!student.name || !student.className || !student.fatherName || !student.phone) {
                    throw new Error('Missing required fields: name, className, fatherName, phone');
                }

                // Generate student ID
                const studentId = `STU${currentYear}${String(nextNumber).padStart(4, '0')}`;
                nextNumber++;

                // Parse dates
                const parsedDob = parseDate(student.dob);
                const parsedAdmissionDate = parseDate(student.admissionDate) || new Date();

                await prisma.studentDetails.create({
                    data: {
                        studentId,
                        name: student.name,
                        className: student.className,
                        section: student.section || 'A',
                        fatherName: student.fatherName,
                        motherName: student.motherName || '',
                        phone: student.phone,
                        email: student.email || null,
                        dob: parsedDob || new Date('2010-01-01'),
                        gender: student.gender || 'Male',
                        admissionDate: parsedAdmissionDate,
                        address: student.address || '',
                        category: student.category || 'NA',
                        religion: student.religion || null,
                        aadharCardNo: student.aadharNo || null,
                        apaarId: student.apaarId || null,
                        whatsAppNo: student.whatsAppNo || null,
                        fatherOccupation: student.fatherOccupation || null,
                        motherOccupation: student.motherOccupation || null,
                        fatherAadharNo: student.fatherAadhar || null,
                        fatherPanNo: student.fatherPan || null,
                        motherAadharNo: student.motherAadhar || null,
                        motherPanNo: student.motherPan || null,
                        sessionId,
                        status: 'active',
                    },
                });

                results.imported++;
            } catch (error: any) {
                results.failed++;
                results.errors.push({
                    row: i + 1,
                    name: student.name || 'Unknown',
                    reason: error.message || 'Unknown error',
                });
            }
        }

        if (results.failed > 0) {
            results.success = false;
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error importing students:', error);
        return NextResponse.json({ error: 'Failed to import students' }, { status: 500 });
    }
}

// Helper to parse date from DD/MM/YYYY or ISO format
function parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;

    // Try DD/MM/YYYY format
    const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateStr.match(ddmmyyyy);
    if (match) {
        const [, day, month, year] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Try ISO format
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date;
    }

    return null;
}
