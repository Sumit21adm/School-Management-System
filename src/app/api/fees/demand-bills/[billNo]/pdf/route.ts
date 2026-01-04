
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Helper to format currency
const formatCurrency = (amount: number | any) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(Number(amount));
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ billNo: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { billNo } = await params;

        const bill = await prisma.demandBill.findUnique({
            where: {
                billNo: billNo
            },
            include: {
                student: true,
                session: true,
                billItems: {
                    include: { feeType: true }
                }
            }
        });

        if (!bill) {
            return new NextResponse('Bill not found', { status: 404 });
        }

        // Generate PDF
        const doc = new jsPDF();
        const schoolName = "SCHOOL MANAGEMENT SYSTEM";

        // Header
        doc.setFontSize(18);
        doc.text(schoolName, 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text('FEE DEMAND BILL', 105, 30, { align: 'center' });

        // Bill Info
        doc.setFontSize(10);
        doc.text(`Bill No: ${bill.billNo}`, 15, 45);
        doc.text(`Date: ${new Date(bill.billDate).toLocaleDateString()}`, 150, 45);

        doc.text(`Student: ${bill.student.name} (${bill.studentId})`, 15, 52);
        doc.text(`Class: ${bill.student.className} - ${bill.student.section}`, 150, 52);
        doc.text(`Father's Name: ${bill.student.fatherName}`, 15, 59);
        doc.text(`Due Date: ${new Date(bill.dueDate).toLocaleDateString()}`, 150, 59);

        // Table
        const tableData = bill.billItems.map(item => [
            item.feeType.name,
            formatCurrency(item.amount)
        ]);

        if (Number(bill.previousDues) > 0) {
            tableData.push(['Previous Dues', formatCurrency(bill.previousDues)]);
        }
        if (Number(bill.lateFee) > 0) {
            tableData.push(['Late Fee', formatCurrency(bill.lateFee)]);
        }
        if (Number(bill.discount) > 0) {
            tableData.push(['Discount', `-${formatCurrency(bill.discount)}`]);
        }
        tableData.push(['TOTAL AMOUNT', formatCurrency(bill.netAmount)]);

        (doc as any).autoTable({
            startY: 65,
            head: [['Description', 'Amount']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [66, 66, 66] },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 40, halign: 'right' }
            }
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.text('This is a computer generated bill.', 105, finalY, { align: 'center' });

        const pdfBuffer = doc.output('arraybuffer');

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${bill.billNo}.pdf"`
            }
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
