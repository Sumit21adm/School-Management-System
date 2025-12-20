import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

// A6 size in points: 105mm × 148.5mm = 297.64pt × 420.94pt
const A6_WIDTH = 297.64;
const A6_HEIGHT = 420.94;
const MARGIN = 15; // Safe print margin

// Font paths for Rupee symbol support
const FONTS_DIR = path.join(process.cwd(), 'src/fonts');
const NOTO_REGULAR = path.join(FONTS_DIR, 'NotoSans-Regular.ttf');
const NOTO_BOLD = path.join(FONTS_DIR, 'NotoSans-Bold.ttf');

@Injectable()
export class ReceiptPdfService {
    constructor(private prisma: PrismaService) { }

    async generateReceipt(transactionId: number): Promise<Buffer> {
        // Fetch transaction with related data
        const transaction = await this.prisma.feeTransaction.findUnique({
            where: { id: transactionId },
            include: {
                student: true,
                paymentDetails: {
                    include: {
                        feeType: true,
                    },
                },
            },
        });

        if (!transaction) {
            throw new Error('Transaction not found');
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

            // Draw receipt content
            this.drawReceiptContent(doc, transaction, printSettings, fontRegular, fontBold);

            doc.end();
        });
    }

    private drawReceiptContent(doc: PDFKit.PDFDocument, transaction: any, settings: any, fontRegular: string, fontBold: string) {
        const contentWidth = A6_WIDTH - 2 * MARGIN;
        let y = MARGIN;

        // --- SINGLE SOLID BORDER AROUND ENTIRE DOCUMENT ---
        doc.rect(MARGIN - 2, MARGIN - 2, contentWidth + 4, A6_HEIGHT - 2 * MARGIN + 4)
            .lineWidth(0.75)
            .stroke('#000000');

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
            .fill('#F5F5F5'); // Light gray background

        doc.fontSize(7)
            .font(fontBold)
            .fillColor('#000000')
            .text('FEE RECEIPT', docTitleX, y + 8 + 5, {
                width: docTitleWidth,
                align: 'center',
            });

        // School Name (Black Bold)
        doc.fontSize(13)
            .font(fontBold)
            .fillColor('#000000')
            .text(settings?.schoolName || 'School Name', textStartX, y + 2, {
                width: textWidth,
            });

        // Tagline
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

        // Affiliation Note
        if (settings?.affiliationNote) {
            doc.fontSize(6)
                .font(fontBold)
                .fillColor('#333333')
                .text(settings.affiliationNote, textStartX, textY, {
                    width: textWidth,
                });
            textY += 8;
        }

        // Affiliation No
        if (settings?.affiliationNo) {
            doc.fontSize(5)
                .font(fontBold)
                .fillColor('#333333')
                .text(`Affiliation No: ${settings.affiliationNo}`, textStartX, textY, {
                    width: textWidth,
                });
        }

        y += logoSize + 5;

        // --- Address Bar (Light gray background) ---
        doc.rect(MARGIN, y, contentWidth, 12)
            .fill('#F5F5F5');

        doc.fontSize(6)
            .font(fontRegular)
            .fillColor('#333333')
            .text(settings?.schoolAddress || 'School Address', MARGIN, y + 3, {
                width: contentWidth,
                align: 'center',
            });

        y += 14;

        // --- Phone, Email & Website Row ---
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

        // --- ISO Note ---
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

        // --- Divider line after header ---
        y += 3;
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(0.5).stroke('#333333');
        doc.lineWidth(1);
        y += 8;

        // --- RECEIPT INFO SECTION ---
        doc.fontSize(6)
            .font(fontRegular)
            .fillColor('#000000');

        const leftColWidth = contentWidth * 0.55;
        const rightColWidth = contentWidth * 0.45;
        const rightColX = MARGIN + leftColWidth;

        // Receipt No | Date
        doc.font(fontBold).text('Receipt No:', MARGIN, y);
        doc.font(fontRegular).text(transaction.receiptNo, MARGIN + 45, y);
        doc.text(`Date: ${new Date(transaction.createdAt).toLocaleDateString('en-GB')}`, rightColX, y, { width: rightColWidth, align: 'right' });
        y += 12;

        // --- Student Info (with light border) ---
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(0.5).stroke('#CCCCCC');
        doc.lineWidth(1);
        y += 8;

        const infoLeftX = MARGIN;
        const infoRightX = MARGIN + contentWidth / 2;
        const labelWidth = 50;

        // Student ID | Class
        doc.font(fontBold).fontSize(6).text('Student ID:', infoLeftX, y);
        doc.font(fontRegular).text(transaction.student?.studentId || 'N/A', infoLeftX + labelWidth, y);
        doc.font(fontBold).text('Class:', infoRightX, y);
        doc.font(fontRegular).text(`${transaction.student?.className || ''} - ${transaction.student?.section || ''}`, infoRightX + 25, y);
        y += 9;

        // Name
        doc.font(fontBold).text('Name:', infoLeftX, y);
        doc.font(fontRegular).text(transaction.student?.name || 'N/A', infoLeftX + labelWidth, y, { width: contentWidth - labelWidth });
        y += 9;

        // Father's Name
        doc.font(fontBold).text("Father's Name:", infoLeftX, y);
        doc.font(fontRegular).text(transaction.student?.fatherName || 'N/A', infoLeftX + 55, y, { width: contentWidth - 55 });
        y += 12;

        // --- FEE DETAILS TABLE ---
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(0.5).stroke('#000000');
        doc.lineWidth(1);
        y += 4;

        const col1X = MARGIN + 2;
        const col2X = MARGIN + 200;

        // Table header
        doc.fontSize(6)
            .font(fontBold)
            .fillColor('#000000');

        doc.text('Fee Type', col1X, y, { width: 150 });
        doc.text('Amount', col2X, y, { width: 55, align: 'right' });

        y += 10;
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(0.5).stroke('#CCCCCC');
        doc.lineWidth(1);
        y += 3;

        // Table rows
        doc.fontSize(6)
            .font(fontRegular);

        for (const detail of transaction.paymentDetails || []) {
            const amount = Number(detail.amount);
            doc.text(detail.feeType?.name || 'Fee', col1X, y, { width: 150 });
            doc.text(amount.toFixed(2), col2X, y, { width: 55, align: 'right' });
            y += 9;
        }

        // Total line separator
        y += 2;
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(1).stroke('#000000');
        y += 5;

        // --- TOTAL ---
        const totalAmount = Number(transaction.amount);
        doc.fontSize(9)
            .font(fontBold)
            .fillColor('#000000')
            .text('TOTAL:', col1X, y);
        doc.text(`₹ ${totalAmount.toFixed(2)}`, col2X - 30, y, { width: 85, align: 'right' });
        y += 12;

        // Amount in words
        doc.fontSize(5)
            .font(fontRegular)
            .text(`In Words: ${this.numberToWords(totalAmount)} Rupees Only`, col1X, y);
        y += 10;

        // Payment Mode
        doc.fontSize(6)
            .font(fontRegular)
            .text(`Payment Mode: ${transaction.paymentMode || 'CASH'}`, col1X, y);
        if (transaction.referenceNo) {
            doc.text(`  |  Ref: ${transaction.referenceNo}`, col1X + 80, y);
        }
        y += 15;

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

        const noteText = settings?.feeReceiptNote || 'Thank you for your payment. This is a computer generated receipt.';
        doc.fontSize(5)
            .font(fontRegular)
            .fillColor('#000000')
            .text(`Note: ${noteText}`, notesX, footerY + 5, {
                width: notesWidth - 5,
            });

        // Thanks and For: School Name
        doc.fontSize(6)
            .font(fontBold)
            .text('Thanks', notesX, footerY + 32, {
                width: notesWidth - 5,
                align: 'right',
            });

        doc.fontSize(5)
            .font(fontRegular)
            .text(`For: ${settings?.schoolName || 'School Name'}`, notesX, footerY + 40, {
                width: notesWidth - 5,
                align: 'right',
            });
    }

    private numberToWords(num: number): string {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
            'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (num === 0) return 'Zero';

        const intNum = Math.floor(num);

        if (intNum < 20) return ones[intNum];
        if (intNum < 100) return tens[Math.floor(intNum / 10)] + (intNum % 10 ? ' ' + ones[intNum % 10] : '');
        if (intNum < 1000) return ones[Math.floor(intNum / 100)] + ' Hundred' + (intNum % 100 ? ' ' + this.numberToWords(intNum % 100) : '');
        if (intNum < 100000) return this.numberToWords(Math.floor(intNum / 1000)) + ' Thousand' + (intNum % 1000 ? ' ' + this.numberToWords(intNum % 1000) : '');
        if (intNum < 10000000) return this.numberToWords(Math.floor(intNum / 100000)) + ' Lakh' + (intNum % 100000 ? ' ' + this.numberToWords(intNum % 100000) : '');
        return this.numberToWords(Math.floor(intNum / 10000000)) + ' Crore' + (intNum % 10000000 ? ' ' + this.numberToWords(intNum % 10000000) : '');
    }

    async generateReceiptByReceiptNo(receiptNo: string): Promise<Buffer> {
        const transaction = await this.prisma.feeTransaction.findUnique({
            where: { receiptNo },
        });

        if (!transaction) {
            throw new Error('Receipt not found');
        }

        return this.generateReceipt(transaction.id);
    }
}
