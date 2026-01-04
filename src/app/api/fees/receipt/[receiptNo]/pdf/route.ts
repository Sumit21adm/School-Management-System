import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ receiptNo: string }>;
}

// GET receipt as PDF
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { receiptNo } = await params;

        const transaction = await prisma.feeTransaction.findUnique({
            where: { receiptNo },
            include: {
                student: {
                    select: {
                        studentId: true,
                        name: true,
                        fatherName: true,
                        className: true,
                        section: true,
                        phone: true,
                    },
                },
                session: { select: { name: true } },
                paymentDetails: {
                    include: { feeType: true },
                },
            },
        });

        if (!transaction) {
            return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
        }

        const printSettings = await prisma.printSettings.findFirst();

        // Generate HTML for PDF
        const html = generateReceiptHtml(transaction, printSettings);

        // Return HTML (can be converted to PDF on frontend or using puppeteer)
        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `inline; filename="receipt_${receiptNo}.html"`,
            },
        });
    } catch (error) {
        console.error('Error generating receipt PDF:', error);
        return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 });
    }
}

function generateReceiptHtml(transaction: any, printSettings: any) {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Fee Receipt - ${transaction.receiptNo}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
        .receipt { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 15px; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { margin: 2px 0; }
        .receipt-title { text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; text-decoration: underline; }
        .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .info-section { margin: 15px 0; padding: 10px; background: #f5f5f5; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #333; padding: 8px; text-align: left; }
        th { background: #e0e0e0; }
        .total-row { font-weight: bold; background: #f0f0f0; }
        .footer { margin-top: 30px; display: flex; justify-content: space-between; }
        .signature { text-align: center; }
        .signature-line { border-top: 1px solid #333; width: 150px; margin-top: 40px; padding-top: 5px; }
        .note { margin-top: 20px; padding: 10px; border: 1px dashed #666; font-size: 10px; }
        @media print {
            body { padding: 0; }
            .receipt { border: none; }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            ${printSettings?.logoUrl ? `<img src="${printSettings.logoUrl}" alt="Logo" style="height: 60px; margin-bottom: 10px;">` : ''}
            <h1>${printSettings?.schoolName || 'School Name'}</h1>
            <p>${printSettings?.schoolAddress || 'School Address'}</p>
            ${printSettings?.phone ? `<p>Phone: ${printSettings.phone}</p>` : ''}
        </div>

        <div class="receipt-title">FEE RECEIPT</div>

        <div class="info-section">
            <div class="info-row">
                <span><strong>Receipt No:</strong> ${transaction.receiptNo}</span>
                <span><strong>Date:</strong> ${formatDate(transaction.date)}</span>
            </div>
            <div class="info-row">
                <span><strong>Student ID:</strong> ${transaction.student.studentId}</span>
                <span><strong>Session:</strong> ${transaction.session?.name || '-'}</span>
            </div>
            <div class="info-row">
                <span><strong>Student Name:</strong> ${transaction.student.name}</span>
                <span><strong>Class:</strong> ${transaction.student.className} - ${transaction.student.section}</span>
            </div>
            <div class="info-row">
                <span><strong>Father's Name:</strong> ${transaction.student.fatherName}</span>
                <span><strong>Phone:</strong> ${transaction.student.phone || '-'}</span>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>S.No</th>
                    <th>Fee Head</th>
                    <th>Amount</th>
                    <th>Discount</th>
                    <th>Net Amount</th>
                </tr>
            </thead>
            <tbody>
                ${transaction.paymentDetails.map((pd: any, i: number) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${pd.feeType.name}</td>
                    <td>${formatCurrency(Number(pd.amount))}</td>
                    <td>${formatCurrency(Number(pd.discountAmount))}</td>
                    <td>${formatCurrency(Number(pd.netAmount))}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="4" style="text-align: right;">Total Amount:</td>
                    <td>${formatCurrency(Number(transaction.amount))}</td>
                </tr>
            </tbody>
        </table>

        <div class="info-row">
            <span><strong>Payment Mode:</strong> ${transaction.paymentMode}</span>
            ${transaction.remarks ? `<span><strong>Remarks:</strong> ${transaction.remarks}</span>` : ''}
        </div>

        <div class="footer">
            <div class="signature">
                <div class="signature-line">Parent/Guardian</div>
            </div>
            <div class="signature">
                <div class="signature-line">Collected By: ${transaction.collectedBy || 'Office'}</div>
            </div>
        </div>

        ${printSettings?.feeReceiptNote ? `
        <div class="note">
            <strong>Note:</strong> ${printSettings.feeReceiptNote}
        </div>
        ` : ''}
    </div>
    <script>window.onload = () => window.print();</script>
</body>
</html>
    `;
}
