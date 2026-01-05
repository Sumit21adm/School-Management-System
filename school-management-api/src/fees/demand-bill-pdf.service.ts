import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

// A6 size in points: 105mm × 148.5mm = 297.64pt × 420.94pt
const A6_WIDTH = 297.64;
const A6_HEIGHT = 420.94;
const MARGIN = 12;

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

        // --- SINGLE SOLID BORDER AROUND ENTIRE DOCUMENT ---
        doc.rect(MARGIN - 2, MARGIN - 2, contentWidth + 4, A6_HEIGHT - 2 * MARGIN + 4)
            .lineWidth(0.75) // Thinner border for cleaner look
            .stroke('#000000');


        let y = MARGIN;

        // --- HEADER SECTION ---
        // Logo on left (45px), School info in middle, Document Title on right
        const logoSize = 45;
        const logoX = MARGIN;
        const docTitleWidth = 70;
        const textStartX = MARGIN + logoSize + 10;
        const textWidth = contentWidth - logoSize - docTitleWidth - 20;

        if (settings?.logoUrl) {
            const logoPath = path.join(process.cwd(), settings.logoUrl);
            if (fs.existsSync(logoPath)) {
                try {
                    doc.image(logoPath, logoX, y, { width: logoSize, height: logoSize });
                } catch (e) {
                    // Logo not available, continue without
                }
            }
        }

        // Document Title Label (top-right corner, address bar style)
        const docTitleX = A6_WIDTH - MARGIN - docTitleWidth;
        const docTitleHeight = 20;
        doc.rect(docTitleX, y + 8, docTitleWidth, docTitleHeight)
            .fill('#F5F5F5'); // Light gray background like address bar

        doc.fontSize(7)
            .font(fontBold)
            .fillColor('#000000')
            .text('FEE DEMAND BILL', docTitleX, y + 8 + 5, {
                width: docTitleWidth,
                align: 'center',
            });

        // School Name (Black Bold, left-aligned to right of logo)
        doc.fontSize(13)
            .font(fontBold)
            .fillColor('#000000') // Black color
            .text(settings?.schoolName || 'School Name', textStartX, y + 2, {
                width: textWidth,
            });

        // Tagline (Smaller gray text below school name)
        let textY = y + 16;
        if (settings?.tagline) {
            doc.fontSize(7)
                .font(fontRegular)
                .fillColor('#666666')
                .text(settings.tagline, textStartX, textY, {
                    width: textWidth,
                });
            textY += 10;
        }

        // Affiliation Note (Bold dark gray below tagline)
        if (settings?.affiliationNote) {
            doc.fontSize(6)
                .font(fontBold)
                .fillColor('#333333')
                .text(settings.affiliationNote, textStartX, textY, {
                    width: textWidth,
                });
            textY += 8;
        }

        // Affiliation No (Bold dark gray below Affiliation Note)
        if (settings?.affiliationNo) {
            doc.fontSize(5)
                .font(fontBold)
                .fillColor('#333333')
                .text(`Affiliation No: ${settings.affiliationNo}`, textStartX, textY, {
                    width: textWidth,
                });
        }

        y += logoSize + 5; // Gap before address bar

        // --- Address Bar (Very light grey background, center aligned) ---
        doc.rect(MARGIN, y, contentWidth, 12)
            .fill('#F5F5F5'); // Very light gray

        doc.fontSize(6)
            .font(fontRegular)
            .fillColor('#333333')
            .text(settings?.schoolAddress || 'School Address', MARGIN, y + 3, {
                width: contentWidth,
                align: 'center',
            });

        y += 14;

        // --- Phone, Email & Website Row (no border/stroke) ---
        const contactParts: string[] = [];
        if (settings?.phone) contactParts.push(`Ph: ${settings.phone}`);
        if (settings?.email) contactParts.push(`Email: ${settings.email}`);
        if (settings?.website) contactParts.push(`Web: ${settings.website}`);

        if (contactParts.length > 0) {
            doc.fontSize(5)
                .font(fontRegular)
                .fillColor('#333333')
                .text(contactParts.join('  |  '), MARGIN, y, {
                    width: contentWidth,
                    align: 'center',
                });
        }

        y += 10;

        // --- ISO Note (Bold dark gray below contact row) ---
        if (settings?.isoCertifiedNote) {
            doc.fontSize(5)
                .font(fontBold)
                .fillColor('#333333')
                .text(settings.isoCertifiedNote, MARGIN, y, {
                    width: contentWidth,
                    align: 'center',
                });
            y += 10;
        }

        // --- Divider line after header (more visible color) ---
        y += 3;
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(0.5).stroke('#333333'); // Darker color for visibility
        doc.lineWidth(1);
        y += 5;

        // --- BILL INFO SECTION ---
        doc.fontSize(6)
            .font(fontRegular)
            .fillColor('#000000');

        // Row 1: Bill No (left) | Date (right)
        const leftColWidth = contentWidth * 0.55;
        const rightColWidth = contentWidth * 0.45;
        const rightColX = MARGIN + leftColWidth;

        // Bill No
        doc.font(fontBold).text('Bill No:', MARGIN, y);
        doc.font(fontRegular).text(bill.billNo, MARGIN + 30, y);

        // Date on right
        doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, rightColX, y, { width: rightColWidth, align: 'right' });
        y += 9;

        // Period (left) | Due Date (right)
        const period = bill.month && bill.year ? `${new Date(bill.year, bill.month - 1).toLocaleString('default', { month: 'long' })} ${bill.year}` : 'N/A';
        doc.text(`Period: ${period}`, MARGIN, y);

        const dueDate = bill.dueDate ? new Date(bill.dueDate) : new Date();
        doc.text(`Due Date: ${dueDate.toLocaleDateString('en-GB')}`, rightColX, y, { width: rightColWidth, align: 'right' });
        y += 10;

        // Student Info Section - lighter/thinner border (half weight)
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(0.5).stroke('#CCCCCC');
        doc.lineWidth(1);
        y += 8; // Added more padding

        // Student details in two columns
        const infoLeftX = MARGIN;
        const infoRightX = MARGIN + contentWidth / 2;
        const labelWidth = 45;

        // Row 1: Student ID | Class
        doc.font(fontBold).fontSize(6).text('Student ID:', infoLeftX, y);
        doc.font(fontRegular).text(bill.student?.studentId || 'N/A', infoLeftX + labelWidth + 5, y);
        doc.font(fontBold).text('Class:', infoRightX, y);
        doc.font(fontRegular).text(`${bill.student?.className || ''} - ${bill.student?.section || ''}`, infoRightX + 25, y);
        y += 9;

        // Row 2: Name
        doc.font(fontBold).text('Name:', infoLeftX, y);
        doc.font(fontRegular).text(bill.student?.name || 'N/A', infoLeftX + labelWidth, y, { width: contentWidth - labelWidth });
        y += 9;

        // Row 3: Father's Name
        doc.font(fontBold).text("Father's Name:", infoLeftX, y);
        doc.font(fontRegular).text(bill.student?.fatherName || 'N/A', infoLeftX + 55, y, { width: contentWidth - 55 });
        y += 12; // Added more padding before fee table

        // --- FEE DETAILS TABLE (lighter borders - half weight) ---
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(0.5).stroke('#000000');
        doc.lineWidth(1);
        y += 4; // Added more padding for table header

        const col1X = MARGIN + 2;
        const col2X = MARGIN + 100;
        const col3X = MARGIN + 150;
        const col4X = MARGIN + 200;

        // Table header - no background, just bold text
        doc.fontSize(6)
            .font(fontBold)
            .fillColor('#000000');

        doc.text('Fee Type', col1X, y, { width: 95 });
        doc.text('Amount', col2X, y, { width: 45, align: 'right' });
        doc.text('Discount', col3X, y, { width: 45, align: 'right' });
        doc.text('Net', col4X, y, { width: 55, align: 'right' });

        y += 10;
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(0.5).stroke('#CCCCCC');
        doc.lineWidth(1);
        y += 3;

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
            doc.text(net.toFixed(2), col4X, y, { width: 55, align: 'right' });

            y += 9;
        }

        // NO separator line after fee items (removed as per feedback)

        // Previous Dues
        const billNetAmount = Number(bill.netAmount) || 0;
        const currentBillNet = totalGross - totalItemDiscount;
        const previousDues = billNetAmount - currentBillNet;

        if (previousDues > 0) {
            doc.font(fontRegular);
            doc.text('Previous Dues', col1X, y, { width: 95 });
            doc.text(previousDues.toFixed(2), col2X, y, { width: 45, align: 'right' });
            doc.text('-', col3X, y, { width: 45, align: 'right' });
            doc.text(previousDues.toFixed(2), col4X, y, { width: 55, align: 'right' });
            y += 9;
        }

        // Total line separator
        y += 2;
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(1).stroke('#000000');
        y += 5;

        // --- TOTAL DUE (black text only) ---
        const netAmount = totalGross + (previousDues > 0 ? previousDues : 0) - totalItemDiscount;

        doc.fontSize(9)
            .font(fontBold)
            .fillColor('#000000')
            .text('TOTAL DUE:', col1X, y);
        doc.text(`₹ ${netAmount.toFixed(2)}`, col4X - 30, y, { width: 85, align: 'right' });
        y += 12;

        // Status
        doc.fontSize(7)
            .font(fontBold)
            .fillColor('#000000')
            .text(`Status: ${bill.status.toUpperCase()}`, col1X, y);
        y += 10;

        // Paid amount and balance
        const paidAmount = Number(bill.paidAmount) || 0;
        if (paidAmount > 0) {
            doc.font(fontRegular)
                .fontSize(6)
                .text(`Paid Amount: ₹ ${paidAmount.toFixed(2)}`, col1X, y);
            y += 8;
            doc.font(fontBold)
                .fillColor('#D32F2F')
                .text(`Balance Due: ₹ ${(netAmount - paidAmount).toFixed(2)}`, col1X, y);
            y += 10;
        }

        // --- FOOTER SECTION (two columns) ---
        const footerY = A6_HEIGHT - MARGIN - 55;
        const qrPlaceholderWidth = 55;
        const notesWidth = contentWidth - qrPlaceholderWidth - 10;

        // Top border line
        doc.moveTo(MARGIN, footerY).lineTo(A6_WIDTH - MARGIN, footerY).lineWidth(0.5).stroke('#000000');

        // Left Column - QR Code Placeholder
        doc.rect(MARGIN + 2, footerY + 5, qrPlaceholderWidth, 45)
            .lineWidth(0.5)
            .stroke('#CCCCCC');

        doc.fontSize(4)
            .font(fontRegular)
            .fillColor('#999999')
            .text('Payment', MARGIN + 2, footerY + 20, {
                width: qrPlaceholderWidth,
                align: 'center',
            });
        doc.text('QR Code', MARGIN + 2, footerY + 26, {
            width: qrPlaceholderWidth,
            align: 'center',
        });

        // Right Column - Notes and School Info
        const notesX = MARGIN + qrPlaceholderWidth + 12;

        // Note label and content
        const noteText = settings?.demandBillNote || 'Please pay by the due date to avoid late fees.';
        doc.fontSize(5)
            .font(fontRegular)
            .fillColor('#000000')
            .text(`Note: ${noteText}`, notesX, footerY + 5, {
                width: notesWidth - 5, // Added padding from right edge
            });

        // Thanks and For: School Name (right aligned at bottom of right column)
        doc.fontSize(6)
            .font(fontBold)
            .text('Thanks', notesX, footerY + 32, {
                width: notesWidth - 5, // Added padding from right edge
                align: 'right',
            });

        doc.fontSize(5)
            .font(fontRegular)
            .text(`For: ${settings?.schoolName || 'School Name'}`, notesX, footerY + 40, {
                width: notesWidth - 5, // Added padding from right edge
                align: 'right',
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
