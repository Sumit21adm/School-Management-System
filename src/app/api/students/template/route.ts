import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET download import template as CSV
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Define template headers matching expected import format
        const headers = [
            'Name',
            'Class',
            'Section',
            'Father Name',
            'Mother Name',
            'Phone',
            'Email',
            'Date of Birth (DD/MM/YYYY)',
            'Gender (Male/Female)',
            'Admission Date (DD/MM/YYYY)',
            'Address',
            'Category (General/OBC/SC/ST/Others)',
            'Religion',
            'Aadhar No',
            'APAAR ID',
            'WhatsApp No',
            'Father Occupation',
            'Mother Occupation',
            'Father Aadhar',
            'Father PAN',
            'Mother Aadhar',
            'Mother PAN',
        ];

        // Sample row for reference
        const sampleRow = [
            'Sample Student',
            '1',
            'A',
            'Father Name',
            'Mother Name',
            '9876543210',
            'sample@email.com',
            '15/08/2015',
            'Male',
            '01/04/2024',
            '123 Sample Address, City',
            'General',
            'Hindu',
            '123456789012',
            'AP123456',
            '9876543210',
            'Business',
            'Homemaker',
            '123456789012',
            'ABCDE1234F',
            '123456789012',
            'ABCDE1234F',
        ];

        const csv = [
            headers.join(','),
            sampleRow.join(','),
            '', // Empty row for user to start entering data
        ].join('\n');

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="student_import_template.csv"',
            },
        });
    } catch (error) {
        console.error('Error generating template:', error);
        return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
    }
}
