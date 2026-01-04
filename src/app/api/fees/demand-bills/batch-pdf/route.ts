
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

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Handle form data submission (browser form submit)
        const formData = await request.formData();
        const billNumbers = formData.getAll('billNumbers[]') as string[];

        if (!billNumbers || billNumbers.length === 0) {
            return new NextResponse('No bills selected', { status: 400 });
        }

        // Fetch bills with all details
        const bills = await prisma.demandBill.findMany({
            where: {
                billNo: { in: billNumbers }
            },
            include: {
                student: true,
                session: true,
                billItems: {
                    include: { feeType: true }
                }
            },
            orderBy: {
                student: {
                    name: 'asc'
                }
            }
        });

        if (bills.length === 0) {
            return new NextResponse('No bills found', { status: 404 });
        }

        // Generate PDF
        const doc = new jsPDF();

        for (let i = 0; i < bills.length; i++) {
            const bill = bills[i];
            if (i > 0) doc.addPage();

            const schoolName = "SCHOOL MANAGEMENT SYSTEM"; // Should fetch from settings

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

            // Add previous dues if positive
            if (Number(bill.previousDues) > 0) {
                tableData.push(['Previous Dues', formatCurrency(bill.previousDues)]);
            }

            // Add late fee if positive
            if (Number(bill.lateFee) > 0) {
                tableData.push(['Late Fee', formatCurrency(bill.lateFee)]);
            }

            // Add discount if positive
            if (Number(bill.discount) > 0) {
                tableData.push(['Discount', `-${formatCurrency(bill.discount)}`]);
            }

            // Total
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
        }

        // Return PDF
        const pdfBuffer = doc.output('arraybuffer');

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="demand-bills-${Date.now()}.pdf"`
            }
        });

    } catch (error) {
        console.error('Error generating batch PDF:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
