import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET ID Card HTML (printable)
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { studentId } = await params;

        const student = await prisma.studentDetails.findFirst({
            where: { studentId },
            include: { session: true },
        });

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        const printSettings = await prisma.printSettings.findFirst();

        const html = generateIdCardHtml(student, printSettings);

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `inline; filename="IDCard_${studentId}.html"`,
            },
        });
    } catch (error) {
        console.error('Error generating ID Card:', error);
        return NextResponse.json({ error: 'Failed to generate ID Card' }, { status: 500 });
    }
}

function generateIdCardHtml(student: any, printSettings: any) {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ID Card - ${student.studentId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; background: #f0f0f0; }
        .id-card { width: 340px; height: 540px; margin: 0 auto; background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%); border-radius: 15px; padding: 20px; color: white; position: relative; overflow: hidden; }
        .id-card::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 50%); }
        .header { text-align: center; position: relative; z-index: 1; }
        .header img { height: 50px; margin-bottom: 8px; }
        .header h1 { font-size: 16px; margin-bottom: 3px; text-transform: uppercase; }
        .header p { font-size: 10px; opacity: 0.9; }
        .card-title { text-align: center; background: #ff6f00; padding: 5px; margin: 15px -20px; font-weight: bold; font-size: 14px; letter-spacing: 2px; }
        .photo-section { text-align: center; margin: 15px 0; position: relative; z-index: 1; }
        .photo { width: 100px; height: 120px; background: white; border: 3px solid white; border-radius: 8px; margin: 0 auto; overflow: hidden; }
        .photo img { width: 100%; height: 100%; object-fit: cover; }
        .photo-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 40px; }
        .details { background: rgba(255,255,255,0.95); color: #333; padding: 15px; border-radius: 10px; margin-top: 10px; position: relative; z-index: 1; }
        .details table { width: 100%; }
        .details td { padding: 4px 5px; }
        .details td:first-child { font-weight: bold; width: 40%; color: #1a237e; }
        .student-name { text-align: center; font-size: 14px; font-weight: bold; color: #1a237e; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #1a237e; }
        .footer { position: absolute; bottom: 15px; left: 20px; right: 20px; display: flex; justify-content: space-between; font-size: 9px; }
        .signature { text-align: center; }
        .signature-line { border-top: 1px solid white; width: 80px; margin-top: 25px; padding-top: 3px; }
        .validity { text-align: center; margin-top: 10px; font-size: 10px; color: #ff6f00; font-weight: bold; }
        @media print {
            body { background: none; padding: 0; }
            .id-card { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="id-card">
        <div class="header">
            ${printSettings?.logoUrl ? `<img src="${printSettings.logoUrl}" alt="Logo">` : ''}
            <h1>${printSettings?.schoolName || 'School Name'}</h1>
            <p>${printSettings?.schoolAddress || 'Address'}</p>
        </div>

        <div class="card-title">IDENTITY CARD</div>

        <div class="photo-section">
            <div class="photo">
                ${student.photoUrl
            ? `<img src="${student.photoUrl}" alt="Student Photo">`
            : '<div class="photo-placeholder">👤</div>'
        }
            </div>
        </div>

        <div class="details">
            <div class="student-name">${student.name}</div>
            <table>
                <tr>
                    <td>Student ID</td>
                    <td>${student.studentId}</td>
                </tr>
                <tr>
                    <td>Class</td>
                    <td>${student.className} - ${student.section}</td>
                </tr>
                <tr>
                    <td>Father's Name</td>
                    <td>${student.fatherName}</td>
                </tr>
                <tr>
                    <td>DOB</td>
                    <td>${formatDate(student.dob)}</td>
                </tr>
                <tr>
                    <td>Phone</td>
                    <td>${student.phone}</td>
                </tr>
                <tr>
                    <td>Address</td>
                    <td style="font-size: 9px;">${student.address?.substring(0, 50)}...</td>
                </tr>
            </table>
            <div class="validity">Valid for Session: ${student.session?.name || 'Current'}</div>
        </div>

        <div class="footer">
            <div class="signature">
                <div class="signature-line">Student</div>
            </div>
            <div class="signature">
                <div class="signature-line">Principal</div>
            </div>
        </div>
    </div>
    <script>window.onload = () => window.print();</script>
</body>
</html>
    `;
}
