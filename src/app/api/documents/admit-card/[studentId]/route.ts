import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET Admit Card HTML (printable)
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { studentId } = await params;
        const { searchParams } = new URL(request.url);
        const examId = searchParams.get('examId');

        const student = await prisma.studentDetails.findFirst({
            where: { studentId },
            include: { session: true },
        });

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Get exam details if examId provided
        let exam = null;
        let schedules: any[] = [];
        if (examId) {
            exam = await prisma.exam.findUnique({
                where: { id: parseInt(examId) },
                include: {
                    examType: true,
                    schedules: {
                        where: { className: student.className },
                        include: { subject: true },
                        orderBy: { date: 'asc' },
                    },
                },
            });
            schedules = exam?.schedules || [];
        }

        const printSettings = await prisma.printSettings.findFirst();

        const html = generateAdmitCardHtml(student, exam, schedules, printSettings);

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `inline; filename="AdmitCard_${studentId}.html"`,
            },
        });
    } catch (error) {
        console.error('Error generating Admit Card:', error);
        return NextResponse.json({ error: 'Failed to generate Admit Card' }, { status: 500 });
    }
}

function generateAdmitCardHtml(student: any, exam: any, schedules: any[], printSettings: any) {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (time: Date) => {
        return new Date(time).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Admit Card - ${student.studentId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
        .admit-card { max-width: 800px; margin: 0 auto; border: 2px solid #1a237e; padding: 25px; }
        .header { text-align: center; border-bottom: 2px solid #1a237e; padding-bottom: 15px; margin-bottom: 15px; }
        .header h1 { font-size: 22px; color: #1a237e; margin-bottom: 5px; }
        .header p { margin: 2px 0; }
        .exam-title { text-align: center; background: #1a237e; color: white; padding: 10px; margin: 15px -25px; font-size: 16px; font-weight: bold; }
        .student-info { display: flex; gap: 20px; margin: 20px 0; align-items: flex-start; }
        .photo { width: 100px; height: 120px; border: 1px solid #333; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
        .photo img { width: 100%; height: 100%; object-fit: cover; }
        .details { flex: 1; }
        .details table { width: 100%; }
        .details td { padding: 6px 10px; }
        .details td:first-child { font-weight: bold; width: 35%; background: #f5f5f5; }
        .schedule { margin: 20px 0; }
        .schedule h3 { margin-bottom: 10px; color: #1a237e; }
        .schedule table { width: 100%; border-collapse: collapse; }
        .schedule th, .schedule td { border: 1px solid #333; padding: 8px; text-align: left; }
        .schedule th { background: #1a237e; color: white; }
        .schedule tr:nth-child(even) { background: #f5f5f5; }
        .instructions { margin: 20px 0; padding: 15px; background: #fff3cd; border: 1px solid #ffecb5; }
        .instructions h4 { color: #856404; margin-bottom: 10px; }
        .instructions ul { margin-left: 20px; }
        .instructions li { margin: 5px 0; }
        .footer { margin-top: 30px; display: flex; justify-content: space-between; }
        .signature { text-align: center; }
        .signature-line { border-top: 1px solid #333; width: 120px; margin-top: 50px; padding-top: 5px; }
        @media print {
            body { padding: 0; }
            .admit-card { border: none; }
        }
    </style>
</head>
<body>
    <div class="admit-card">
        <div class="header">
            ${printSettings?.logoUrl ? `<img src="${printSettings.logoUrl}" alt="Logo" style="height: 60px; margin-bottom: 10px;">` : ''}
            <h1>${printSettings?.schoolName || 'School Name'}</h1>
            <p>${printSettings?.schoolAddress || 'Address'}</p>
            ${printSettings?.phone ? `<p>Phone: ${printSettings.phone}</p>` : ''}
        </div>

        <div class="exam-title">
            ADMIT CARD${exam ? ` - ${exam.name}` : ''}
        </div>

        <div class="student-info">
            <div class="photo">
                ${student.photoUrl
            ? `<img src="${student.photoUrl}" alt="Photo">`
            : '📷 Photo'
        }
            </div>
            <div class="details">
                <table>
                    <tr>
                        <td>Student Name</td>
                        <td>${student.name}</td>
                    </tr>
                    <tr>
                        <td>Student ID</td>
                        <td>${student.studentId}</td>
                    </tr>
                    <tr>
                        <td>Father's Name</td>
                        <td>${student.fatherName}</td>
                    </tr>
                    <tr>
                        <td>Class / Section</td>
                        <td>${student.className} - ${student.section}</td>
                    </tr>
                    <tr>
                        <td>Session</td>
                        <td>${student.session?.name || '-'}</td>
                    </tr>
                    ${exam ? `
                    <tr>
                        <td>Exam Type</td>
                        <td>${exam.examType?.name || '-'}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
        </div>

        ${schedules.length > 0 ? `
        <div class="schedule">
            <h3>📅 Examination Schedule</h3>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Subject</th>
                        <th>Time</th>
                        <th>Room</th>
                    </tr>
                </thead>
                <tbody>
                    ${schedules.map(s => `
                    <tr>
                        <td>${formatDate(s.date)}</td>
                        <td>${s.subject?.name || '-'}</td>
                        <td>${formatTime(s.startTime)} - ${formatTime(s.endTime)}</td>
                        <td>${s.roomNo || '-'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="instructions">
            <h4>📋 Important Instructions:</h4>
            <ul>
                <li>Students must carry this admit card to the examination hall.</li>
                <li>Reach the examination center 30 minutes before the exam.</li>
                <li>Electronic devices are strictly prohibited.</li>
                <li>Write your roll number clearly on the answer sheet.</li>
                <li>Do not indulge in any form of malpractice.</li>
            </ul>
        </div>

        <div class="footer">
            <div class="signature">
                <div class="signature-line">Student Signature</div>
            </div>
            <div class="signature">
                <div class="signature-line">Class Teacher</div>
            </div>
            <div class="signature">
                <div class="signature-line">Principal</div>
            </div>
        </div>

        ${printSettings?.admitCardNote ? `
        <p style="margin-top: 20px; font-size: 10px; text-align: center; color: #666;">
            ${printSettings.admitCardNote}
        </p>
        ` : ''}
    </div>
    <script>window.onload = () => window.print();</script>
</body>
</html>
    `;
}
