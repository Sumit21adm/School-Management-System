import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

// A6 size in points: 105mm × 148.5mm = 297.64pt × 420.94pt
const A6_WIDTH = 297.64;
const A6_HEIGHT = 420.94;
const MARGIN = 15;

// Font paths for Rupee symbol support
const FONTS_DIR = path.join(process.cwd(), 'src/fonts');
const NOTO_REGULAR = path.join(FONTS_DIR, 'NotoSans-Regular.ttf');
const NOTO_BOLD = path.join(FONTS_DIR, 'NotoSans-Bold.ttf');

@Injectable()
export class DemandBillPdfService {
    constructor(private prisma: PrismaService) { }

    async generateDemandBillPdf(billNo: string): Promise<Buffer> {
        // Fetch demand bill with related data
        const bill = await this.prisma.demandBill.findUnique({
            where: { billNo },
            include: {
                student: true,
                billItems: {
                    include: {
                        feeType: true,
                    },
                },
            },
        });

        if (!bill) {
            throw new Error('Demand bill not found');
        }

        // Fetch print settings
        const printSettings = await this.prisma.printSettings.findFirst();

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];

            // Create A6 size PDF
            const doc = new PDFDocument({
                size: [A6_WIDTH, A6_HEIGHT],
                margin: MARGIN,
            });

            // Register Noto Sans fonts for Rupee symbol support
            let fontRegular = 'Helvetica';
            let fontBold = 'Helvetica-Bold';

            if (fs.existsSync(NOTO_REGULAR) && fs.existsSync(NOTO_BOLD)) {
                doc.registerFont('NotoSans', NOTO_REGULAR);
                doc.registerFont('NotoSans-Bold', NOTO_BOLD);
                fontRegular = 'NotoSans';
                fontBold = 'NotoSans-Bold';
            }

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Draw demand bill content
            this.drawDemandBillContent(doc, bill, printSettings, fontRegular, fontBold);

            doc.end();
        });
    }

    private drawDemandBillContent(doc: PDFKit.PDFDocument, bill: any, settings: any, fontRegular: string, fontBold: string) {
        const contentWidth = A6_WIDTH - 2 * MARGIN;
        let y = MARGIN;

        // --- HEADER ---
        // Logo (if available)
        if (settings?.logoUrl) {
            const logoPath = path.join(process.cwd(), settings.logoUrl);
            if (fs.existsSync(logoPath)) {
                try {
                    doc.image(logoPath, MARGIN, y, { width: 35, height: 35 });
                } catch (e) {
                    // Logo not available, continue without
                }
            }
        }

        // School name
        doc.fontSize(11)
            .font(fontBold)
            .text(settings?.schoolName || 'SCHOOL NAME', MARGIN + 40, y + 5, {
                width: contentWidth - 45,
                align: 'center',
            });

        y += 18;

        // Tagline or Address
        if (settings?.tagline) {
            doc.fontSize(7)
                .font(fontRegular)
                .text(settings.tagline, MARGIN + 40, y + 5, {
                    width: contentWidth - 45,
                    align: 'center',
                });
            y += 10;
        }

        // Address
        doc.fontSize(6)
            .font(fontRegular)
            .text(settings?.schoolAddress || 'School Address', MARGIN, y + 15, {
                width: contentWidth,
                align: 'center',
            });

        y += 28;

        // Contact info
        const contacts = [settings?.phone, settings?.email].filter(Boolean).join(' | ');
        if (contacts) {
            doc.fontSize(5)
                .text(contacts, MARGIN, y, {
                    width: contentWidth,
                    align: 'center',
                });
            y += 10;
        }

        // --- DEMAND BILL TITLE ---
        y += 5;
        doc.fontSize(10)
            .font(fontBold)
            .text('FEE DEMAND BILL', MARGIN, y, {
                width: contentWidth,
                align: 'center',
            });

        // Line under title
        doc.moveTo(MARGIN, y + 15)
            .lineTo(A6_WIDTH - MARGIN, y + 15)
            .stroke();

        y += 20;

        // --- BILL INFO ---
        doc.fontSize(7)
            .font(fontRegular);

        // Bill No and Date row
        doc.text(`Bill No: ${bill.billNo}`, MARGIN, y);
        doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, MARGIN, y, { align: 'right', width: contentWidth });
        y += 10;

        // Due Date
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15); // 15 days due date
        doc.text(`Due Date: ${dueDate.toLocaleDateString('en-GB')}`, MARGIN, y);
        y += 10;

        // Period
        const period = bill.month && bill.year ? `${new Date(bill.year, bill.month - 1).toLocaleString('default', { month: 'long' })} ${bill.year}` : 'N/A';
        doc.text(`Period: ${period}`, MARGIN, y);
        y += 10;

        // Student ID
        doc.text(`Student ID: ${bill.student?.admissionNo || 'N/A'}`, MARGIN, y);
        y += 10;

        // Student Name
        doc.font(fontBold)
            .text(`Name: ${bill.student?.name || 'N/A'}`, MARGIN, y);
        y += 10;

        // Class/Section
        doc.font(fontRegular)
            .text(`Class: ${bill.student?.className || ''} - ${bill.student?.section || ''}`, MARGIN, y);
        y += 12;

        // Divider
        doc.moveTo(MARGIN, y)
            .lineTo(A6_WIDTH - MARGIN, y)
            .stroke();
        y += 5;

        // --- FEE DETAILS TABLE ---
        // Table header
        doc.fontSize(7)
            .font(fontBold);

        const col1X = MARGIN;
        const col2X = MARGIN + 100;
        const col3X = MARGIN + 160;
        const col4X = MARGIN + 220;

        doc.text('Fee Type', col1X, y, { width: 95 });
        doc.text('Amount', col2X, y, { width: 45, align: 'right' });
        doc.text('Discount', col3X, y, { width: 45, align: 'right' });
        doc.text('Net', col4X, y, { width: 45, align: 'right' }); // Shifted Net col left slightly

        y += 10;
        doc.moveTo(MARGIN, y)
            .lineTo(A6_WIDTH - MARGIN, y)
            .stroke();
        y += 5;

        // Table rows
        doc.fontSize(6)
            .font(fontRegular);

        let totalGross = 0;
        let totalItemDiscount = 0;

        for (const item of bill.billItems || []) {
            const amount = Number(item.amount);
            const discount = Number(item.discountAmount) || 0;
            const net = amount - discount;

            totalGross += amount;
            totalItemDiscount += discount;

            doc.text(item.feeType?.name || 'Fee', col1X, y, { width: 95 });
            doc.text(amount.toFixed(2), col2X, y, { width: 45, align: 'right' });
            doc.text(discount > 0 ? discount.toFixed(2) : '-', col3X, y, { width: 45, align: 'right' });
            doc.text(net.toFixed(2), col4X, y, { width: 45, align: 'right' });

            y += 10;
        }

        // Add line after items
        y += 5;
        doc.moveTo(MARGIN, y)
            .lineTo(A6_WIDTH - MARGIN, y)
            .stroke();
        y += 5;

        // Previous Dues Logic
        const billTotalAmount = Number(bill.totalAmount) || 0; // This is sum of items
        const billDiscount = Number(bill.discount) || 0;       // Bill level discount
        const billNetAmount = Number(bill.netAmount) || 0;     // Final stored amount

        // previousDues = netAmount - (items - discount) 
        // OR retrieve from calculation if possible. Since we don't have it stored directly on bill, 
        // we infer it: previousDues = bill.netAmount - (totalGross - totalItemDiscount)
        // Note: bill.discount should be 0 if we use item discounts, but let's be safe

        const currentBillNet = totalGross - totalItemDiscount - billDiscount;
        const previousDues = billNetAmount - currentBillNet;

        // Show previous dues as separate line if applicable
        if (previousDues > 0) {
            doc.font(fontRegular);
            doc.text('Previous Dues', col1X, y, { width: 95 });
            doc.text(previousDues.toFixed(2), col2X, y, { width: 45, align: 'right' });
            doc.text('-', col3X, y, { width: 45, align: 'right' });
            doc.text(previousDues.toFixed(2), col4X, y, { width: 45, align: 'right' });
            y += 10;
            doc.font(fontRegular);
        }

        // Calculate net amount from items + previousDues - total discount
        const netAmount = totalGross + previousDues - totalItemDiscount;

        y += 5;

        // Divider before total
        doc.moveTo(MARGIN, y)
            .lineTo(A6_WIDTH - MARGIN, y)
            .stroke();
        y += 8;

        // --- TOTAL ---
        doc.fontSize(8)
            .font(fontBold)
            .text('TOTAL DUE:', MARGIN, y);
        doc.text(`₹ ${netAmount.toFixed(2)}`, col4X - 10, y, { width: 65, align: 'right' });
        y += 15;

        // Status
        doc.fontSize(7)
            .font(fontRegular)
            .text(`Status: ${bill.status.toUpperCase()}`, MARGIN, y);
        y += 10;

        const paidAmount = Number(bill.paidAmount) || 0;
        if (paidAmount > 0) {
            doc.text(`Paid: ₹ ${paidAmount.toFixed(2)}`, MARGIN, y);
            y += 10;
            doc.font(fontBold)
                .text(`Balance: ₹ ${(netAmount - paidAmount).toFixed(2)}`, MARGIN, y);
            y += 10;
        }

        // --- FOOTER ---
        y = A6_HEIGHT - MARGIN - 35;

        // Payment instructions
        doc.fontSize(6)
            .font(fontRegular)
            .text('Please pay by the due date to avoid late fees.', MARGIN, y, {
                width: contentWidth,
                align: 'center',
            });

        // Footer note
        doc.fontSize(5)
            .font(fontRegular) // Oblique not supported in NotoSans usually, using Regular
            .text('This is a computer generated demand bill.', MARGIN, y + 10, {
                width: contentWidth,
                align: 'center',
            });
    }

    /**
     * Generate a single PDF with multiple demand bills (one page per bill)
     */
    async generateBatchPdf(billNumbers: string[]): Promise<Buffer> {
        if (!billNumbers || billNumbers.length === 0) {
            console.error('generateBatchPdf called with empty/null billNumbers');
            throw new Error('No bill numbers provided');
        }

        console.log(`generateBatchPdf: Fetching ${billNumbers.length} bills from DB...`);
        // Fetch all bills with related data
        const bills = await this.prisma.demandBill.findMany({
            where: { billNo: { in: billNumbers } },
            include: {
                student: true,
                billItems: {
                    include: {
                        feeType: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log(`generateBatchPdf: Found ${bills.length} bills.`);
        if (bills.length === 0) {
            console.error('generateBatchPdf: No bills found matching provided numbers.');
            throw new Error('No demand bills found');
        }

        // Fetch print settings
        const printSettings = await this.prisma.printSettings.findFirst();

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];

            // Create A6 size PDF
            const doc = new PDFDocument({
                size: [A6_WIDTH, A6_HEIGHT],
                margin: MARGIN,
            });

            // Register Noto Sans fonts for Rupee symbol support
            let fontRegular = 'Helvetica';
            let fontBold = 'Helvetica-Bold';

            if (fs.existsSync(NOTO_REGULAR) && fs.existsSync(NOTO_BOLD)) {
                doc.registerFont('NotoSans', NOTO_REGULAR);
                doc.registerFont('NotoSans-Bold', NOTO_BOLD);
                fontRegular = 'NotoSans';
                fontBold = 'NotoSans-Bold';
            }

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Draw each bill on a separate page
            bills.forEach((bill, index) => {
                if (index > 0) {
                    doc.addPage();
                }
                this.drawDemandBillContent(doc, bill, printSettings, fontRegular, fontBold);
            });

            doc.end();
        });
    }
}
