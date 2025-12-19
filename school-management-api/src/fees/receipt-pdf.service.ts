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

        // --- RECEIPT TITLE ---
        y += 5;
        doc.fontSize(10)
            .font(fontBold)
            .text('FEE RECEIPT', MARGIN, y, {
                width: contentWidth,
                align: 'center',
            });

        // Line under title
        doc.moveTo(MARGIN, y + 15)
            .lineTo(A6_WIDTH - MARGIN, y + 15)
            .stroke();

        y += 20;

        // --- RECEIPT INFO ---
        doc.fontSize(7)
            .font(fontRegular);

        // Receipt No and Date row
        doc.text(`Receipt No: ${transaction.receiptNo}`, MARGIN, y);
        doc.text(`Date: ${new Date(transaction.createdAt).toLocaleDateString('en-GB')}`, MARGIN, y, { align: 'right', width: contentWidth });
        y += 10;

        // Student ID
        doc.text(`Student ID: ${transaction.student?.admissionNo || 'N/A'}`, MARGIN, y);
        y += 10;

        // Student Name
        doc.font(fontBold)
            .text(`Name: ${transaction.student?.name || 'N/A'}`, MARGIN, y);
        y += 10;

        // Class/Section
        doc.font(fontRegular)
            .text(`Class: ${transaction.student?.className || ''} - ${transaction.student?.section || ''}`, MARGIN, y);
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
        const col2X = MARGIN + 120; // Unused in loop
        const col3X = MARGIN + 120; // Unused in loop
        const col4X = MARGIN + 220;

        doc.text('Fee Type', col1X, y, { width: 115 });
        doc.text('Amount', col4X, y, { width: 45, align: 'right' });

        y += 10;
        doc.moveTo(MARGIN, y)
            .lineTo(A6_WIDTH - MARGIN, y)
            .stroke();
        y += 5;

        // Table rows
        doc.fontSize(6)
            .font(fontRegular);

        for (const detail of transaction.paymentDetails || []) {
            const amount = Number(detail.amount);

            doc.text(detail.feeType?.name || 'Fee', col1X, y, { width: 115 });
            doc.text(amount.toFixed(2), col4X, y, { width: 45, align: 'right' });

            y += 10;
        }

        // Add line after items
        y += 5;
        doc.moveTo(MARGIN, y)
            .lineTo(A6_WIDTH - MARGIN, y)
            .stroke();
        y += 5;

        // --- TOTAL ---
        const totalAmount = Number(transaction.amount);
        doc.fontSize(8)
            .font(fontBold)
            .text('TOTAL:', MARGIN, y);
        doc.text(`₹ ${totalAmount.toFixed(2)}`, col4X - 30, y, { width: 75, align: 'right' });
        y += 15;

        // Amount in words
        doc.fontSize(6)
            .font(fontRegular)
            .text(`Amount in words: ${this.numberToWords(totalAmount)} Rupees Only`, MARGIN, y);
        y += 15;

        // Payment Mode
        doc.fontSize(7)
            .font(fontRegular)
            .text(`Payment Mode: ${transaction.paymentMode || 'CASH'}`, MARGIN, y);
        if (transaction.referenceNo) {
            y += 10;
            doc.text(`Ref No: ${transaction.referenceNo}`, MARGIN, y);
        }
        y += 15;

        // --- FOOTER ---

        // Receiver Signature Placeholder
        doc.fontSize(7)
            .text('Receiver Signature', A6_WIDTH - MARGIN - 80, y, { width: 80, align: 'right' });

        // Thank you note
        y = A6_HEIGHT - MARGIN - 15;
        doc.fontSize(5)
            .font(fontRegular)
            .text('Thank you for your payment. This is a computer generated receipt.', MARGIN, y, {
                width: contentWidth,
                align: 'center',
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
