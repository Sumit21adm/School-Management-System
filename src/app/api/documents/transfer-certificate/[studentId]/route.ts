import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET Transfer Certificate HTML (printable)
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

        const html = generateTransferCertificateHtml(student, printSettings);

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `inline; filename="TC_${studentId}.html"`,
            },
        });
    } catch (error) {
        console.error('Error generating TC:', error);
        return NextResponse.json({ error: 'Failed to generate TC' }, { status: 500 });
    }
}

function generateTransferCertificateHtml(student: any, printSettings: any) {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const today = formatDate(new Date());

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Transfer Certificate - ${student.studentId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 14px; padding: 40px; }
        .certificate { max-width: 800px; margin: 0 auto; border: 3px double #000; padding: 40px; position: relative; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 26px; margin-bottom: 5px; text-transform: uppercase; }
        .header h2 { font-size: 22px; margin: 10px 0; text-decoration: underline; }
        .header p { margin: 3px 0; }
        .affiliation { font-size: 12px; margin-top: 10px; }
        .sr-no { position: absolute; top: 40px; left: 40px; }
        .date-issued { position: absolute; top: 40px; right: 40px; }
        .content { line-height: 2; margin: 30px 0; }
        .content p { margin: 15px 0; text-align: justify; }
        .field { font-weight: bold; text-decoration: underline; }
        table { width: 100%; margin: 20px 0; }
        table td { padding: 8px 5px; }
        table td:first-child { width: 40%; }
        .footer { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature { text-align: center; }
        .signature-line { border-top: 1px solid #000; width: 150px; margin-top: 60px; padding-top: 5px; }
        .note { margin-top: 30px; font-size: 12px; border-top: 1px solid #ccc; padding-top: 15px; }
        @media print {
            body { padding: 0; }
            .certificate { border: none; }
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="sr-no">Sr. No: TC/${student.id}/${new Date().getFullYear()}</div>
        <div class="date-issued">Date: ${today}</div>

        <div class="header">
            ${printSettings?.logoUrl ? `<img src="${printSettings.logoUrl}" alt="Logo" style="height: 80px; margin-bottom: 10px;">` : ''}
            <h1>${printSettings?.schoolName || 'School Name'}</h1>
            <p>${printSettings?.schoolAddress || 'School Address'}</p>
            ${printSettings?.affiliationNote ? `<p class="affiliation">${printSettings.affiliationNote}</p>` : ''}
            <h2>TRANSFER CERTIFICATE</h2>
        </div>

        <div class="content">
            <table>
                <tr>
                    <td>1. Name of Student</td>
                    <td class="field">${student.name}</td>
                </tr>
                <tr>
                    <td>2. Student ID / Admission No.</td>
                    <td class="field">${student.studentId}</td>
                </tr>
                <tr>
                    <td>3. Father's Name</td>
                    <td class="field">${student.fatherName}</td>
                </tr>
                <tr>
                    <td>4. Mother's Name</td>
                    <td class="field">${student.motherName}</td>
                </tr>
                <tr>
                    <td>5. Date of Birth (in words)</td>
                    <td class="field">${formatDate(student.dob)}</td>
                </tr>
                <tr>
                    <td>6. Nationality</td>
                    <td class="field">Indian</td>
                </tr>
                <tr>
                    <td>7. Category</td>
                    <td class="field">${student.category || 'NA'}</td>
                </tr>
                <tr>
                    <td>8. Date of Admission</td>
                    <td class="field">${formatDate(student.admissionDate)}</td>
                </tr>
                <tr>
                    <td>9. Class in which admitted</td>
                    <td class="field">${student.className}</td>
                </tr>
                <tr>
                    <td>10. Class from which leaving</td>
                    <td class="field">${student.className} - ${student.section}</td>
                </tr>
                <tr>
                    <td>11. Session</td>
                    <td class="field">${student.session?.name || '-'}</td>
                </tr>
                <tr>
                    <td>12. Date of Issue</td>
                    <td class="field">${today}</td>
                </tr>
                <tr>
                    <td>13. Reason for leaving</td>
                    <td class="field">________________</td>
                </tr>
                <tr>
                    <td>14. Character & Conduct</td>
                    <td class="field">Good</td>
                </tr>
                <tr>
                    <td>15. Fees paid upto</td>
                    <td class="field">________________</td>
                </tr>
            </table>
        </div>

        <div class="footer">
            <div class="signature">
                <div class="signature-line">Class Teacher</div>
            </div>
            <div class="signature">
                <div class="signature-line">Principal</div>
            </div>
        </div>

        ${printSettings?.transferCertNote ? `
        <div class="note">
            <strong>Note:</strong> ${printSettings.transferCertNote}
        </div>
        ` : ''}
    </div>
    <script>window.onload = () => window.print();</script>
</body>
</html>
    `;
}
