import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET export students as JSON (can be converted to Excel/PDF on frontend)
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const className = searchParams.get('className');
        const section = searchParams.get('section');
        const sessionId = searchParams.get('sessionId');
        const status = searchParams.get('status') || 'active';
        const format = searchParams.get('format') || 'json'; // json, csv

        const where: any = {};
        if (className) where.className = className;
        if (section) where.section = section;
        if (sessionId) where.sessionId = parseInt(sessionId);
        if (status && status !== 'all') where.status = status;

        const students = await prisma.studentDetails.findMany({
            where,
            include: {
                session: true,
            },
            orderBy: [
                { className: 'asc' },
                { section: 'asc' },
                { name: 'asc' },
            ],
        });

        // Transform for export
        const exportData = students.map(s => ({
            'Student ID': s.studentId,
            'Name': s.name,
            'Class': s.className,
            'Section': s.section,
            'Father Name': s.fatherName,
            'Mother Name': s.motherName,
            'Phone': s.phone,
            'Email': s.email || '',
            'Date of Birth': s.dob.toISOString().split('T')[0],
            'Gender': s.gender,
            'Admission Date': s.admissionDate.toISOString().split('T')[0],
            'Address': s.address,
            'Category': s.category,
            'Religion': s.religion || '',
            'Aadhar No': s.aadharCardNo || '',
            'APAAR ID': s.apaarId || '',
            'WhatsApp': s.whatsAppNo || '',
            'Status': s.status,
            'Session': s.session?.name || '',
        }));

        if (format === 'csv') {
            // Generate CSV
            const headers = Object.keys(exportData[0] || {});
            const csvRows = [
                headers.join(','),
                ...exportData.map(row =>
                    headers.map(h => {
                        const val = (row as any)[h];
                        // Escape quotes and wrap in quotes if contains comma
                        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                            return `"${val.replace(/"/g, '""')}"`;
                        }
                        return val;
                    }).join(',')
                )
            ];
            const csv = csvRows.join('\n');

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="students_export_${new Date().toISOString().split('T')[0]}.csv"`,
                },
            });
        }

        return NextResponse.json({
            data: exportData,
            meta: {
                total: exportData.length,
                exportedAt: new Date().toISOString(),
                filters: { className, section, sessionId, status },
            },
        });
    } catch (error) {
        console.error('Error exporting students:', error);
        return NextResponse.json({ error: 'Failed to export students' }, { status: 500 });
    }
}
