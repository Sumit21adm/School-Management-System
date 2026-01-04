"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptPdfService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const pdfkit_1 = __importDefault(require("pdfkit"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const A6_WIDTH = 297.64;
const A6_HEIGHT = 420.94;
const MARGIN = 15;
const FONTS_DIR = path.join(process.cwd(), 'src/fonts');
const NOTO_REGULAR = path.join(FONTS_DIR, 'NotoSans-Regular.ttf');
const NOTO_BOLD = path.join(FONTS_DIR, 'NotoSans-Bold.ttf');
let ReceiptPdfService = class ReceiptPdfService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateReceipt(transactionId) {
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
        const printSettings = await this.prisma.printSettings.findFirst();
        return new Promise((resolve, reject) => {
            const chunks = [];
            const doc = new pdfkit_1.default({
                size: [A6_WIDTH, A6_HEIGHT],
                margin: MARGIN,
            });
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
            this.drawReceiptContent(doc, transaction, printSettings, fontRegular, fontBold);
            doc.end();
        });
    }
    drawReceiptContent(doc, transaction, settings, fontRegular, fontBold) {
        const contentWidth = A6_WIDTH - 2 * MARGIN;
        let y = MARGIN;
        doc.rect(MARGIN - 2, MARGIN - 2, contentWidth + 4, A6_HEIGHT - 2 * MARGIN + 4)
            .lineWidth(0.75)
            .stroke('#000000');
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
                }
                catch (e) {
                }
            }
        }
        const docTitleX = A6_WIDTH - MARGIN - docTitleWidth;
        const docTitleHeight = 20;
        doc.rect(docTitleX, y + 8, docTitleWidth, docTitleHeight)
            .fill('#F5F5F5');
        doc.fontSize(7)
            .font(fontBold)
            .fillColor('#000000')
            .text('FEE RECEIPT', docTitleX, y + 8 + 5, {
            width: docTitleWidth,
            align: 'center',
        });
        doc.fontSize(13)
            .font(fontBold)
            .fillColor('#000000')
            .text(settings?.schoolName || 'School Name', textStartX, y + 2, {
            width: textWidth,
        });
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
        if (settings?.affiliationNote) {
            doc.fontSize(6)
                .font(fontBold)
                .fillColor('#333333')
                .text(settings.affiliationNote, textStartX, textY, {
                width: textWidth,
            });
            textY += 8;
        }
        if (settings?.affiliationNo) {
            doc.fontSize(5)
                .font(fontBold)
                .fillColor('#333333')
                .text(`Affiliation No: ${settings.affiliationNo}`, textStartX, textY, {
                width: textWidth,
            });
        }
        y += logoSize + 5;
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
        const contactParts = [];
        if (settings?.phone)
            contactParts.push(`Ph: ${settings.phone}`);
        if (settings?.email)
            contactParts.push(`Email: ${settings.email}`);
        if (settings?.website)
            contactParts.push(`Web: ${settings.website}`);
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
        y += 3;
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(0.5).stroke('#333333');
        doc.lineWidth(1);
        y += 8;
        doc.fontSize(6)
            .font(fontRegular)
            .fillColor('#000000');
        const leftColWidth = contentWidth * 0.55;
        const rightColWidth = contentWidth * 0.45;
        const rightColX = MARGIN + leftColWidth;
        doc.font(fontBold).text('Receipt No:', MARGIN, y);
        doc.font(fontRegular).text(transaction.receiptNo, MARGIN + 45, y);
        doc.text(`Date: ${new Date(transaction.createdAt).toLocaleDateString('en-GB')}`, rightColX, y, { width: rightColWidth, align: 'right' });
        y += 12;
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(0.5).stroke('#CCCCCC');
        doc.lineWidth(1);
        y += 8;
        const infoLeftX = MARGIN;
        const infoRightX = MARGIN + contentWidth / 2;
        const labelWidth = 50;
        doc.font(fontBold).fontSize(6).text('Student ID:', infoLeftX, y);
        doc.font(fontRegular).text(transaction.student?.studentId || 'N/A', infoLeftX + labelWidth, y);
        doc.font(fontBold).text('Class:', infoRightX, y);
        doc.font(fontRegular).text(`${transaction.student?.className || ''} - ${transaction.student?.section || ''}`, infoRightX + 25, y);
        y += 9;
        doc.font(fontBold).text('Name:', infoLeftX, y);
        doc.font(fontRegular).text(transaction.student?.name || 'N/A', infoLeftX + labelWidth, y, { width: contentWidth - labelWidth });
        y += 9;
        doc.font(fontBold).text("Father's Name:", infoLeftX, y);
        doc.font(fontRegular).text(transaction.student?.fatherName || 'N/A', infoLeftX + 55, y, { width: contentWidth - 55 });
        y += 12;
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(0.5).stroke('#000000');
        doc.lineWidth(1);
        y += 4;
        const col1X = MARGIN + 2;
        const col2X = MARGIN + 200;
        doc.fontSize(6)
            .font(fontBold)
            .fillColor('#000000');
        doc.text('Fee Type', col1X, y, { width: 150 });
        doc.text('Amount', col2X, y, { width: 55, align: 'right' });
        y += 10;
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(0.5).stroke('#CCCCCC');
        doc.lineWidth(1);
        y += 3;
        doc.fontSize(6)
            .font(fontRegular);
        for (const detail of transaction.paymentDetails || []) {
            const amount = Number(detail.amount);
            doc.text(detail.feeType?.name || 'Fee', col1X, y, { width: 150 });
            doc.text(amount.toFixed(2), col2X, y, { width: 55, align: 'right' });
            y += 9;
        }
        y += 2;
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(1).stroke('#000000');
        y += 5;
        const totalAmount = Number(transaction.amount);
        doc.fontSize(9)
            .font(fontBold)
            .fillColor('#000000')
            .text('TOTAL:', col1X, y);
        doc.text(`₹ ${totalAmount.toFixed(2)}`, col2X - 30, y, { width: 85, align: 'right' });
        y += 12;
        doc.fontSize(5)
            .font(fontRegular)
            .text(`In Words: ${this.numberToWords(totalAmount)} Rupees Only`, col1X, y);
        y += 10;
        doc.fontSize(6)
            .font(fontRegular)
            .text(`Payment Mode: ${transaction.paymentMode || 'CASH'}`, col1X, y);
        if (transaction.referenceNo) {
            doc.text(`  |  Ref: ${transaction.referenceNo}`, col1X + 80, y);
        }
        y += 15;
        const footerY = A6_HEIGHT - MARGIN - 55;
        const qrPlaceholderWidth = 55;
        const notesWidth = contentWidth - qrPlaceholderWidth - 10;
        doc.moveTo(MARGIN, footerY).lineTo(A6_WIDTH - MARGIN, footerY).lineWidth(0.5).stroke('#000000');
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
        const notesX = MARGIN + qrPlaceholderWidth + 12;
        const noteText = settings?.feeReceiptNote || 'Thank you for your payment. This is a computer generated receipt.';
        doc.fontSize(5)
            .font(fontRegular)
            .fillColor('#000000')
            .text(`Note: ${noteText}`, notesX, footerY + 5, {
            width: notesWidth - 5,
        });
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
    numberToWords(num) {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
            'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        if (num === 0)
            return 'Zero';
        const intNum = Math.floor(num);
        if (intNum < 20)
            return ones[intNum];
        if (intNum < 100)
            return tens[Math.floor(intNum / 10)] + (intNum % 10 ? ' ' + ones[intNum % 10] : '');
        if (intNum < 1000)
            return ones[Math.floor(intNum / 100)] + ' Hundred' + (intNum % 100 ? ' ' + this.numberToWords(intNum % 100) : '');
        if (intNum < 100000)
            return this.numberToWords(Math.floor(intNum / 1000)) + ' Thousand' + (intNum % 1000 ? ' ' + this.numberToWords(intNum % 1000) : '');
        if (intNum < 10000000)
            return this.numberToWords(Math.floor(intNum / 100000)) + ' Lakh' + (intNum % 100000 ? ' ' + this.numberToWords(intNum % 100000) : '');
        return this.numberToWords(Math.floor(intNum / 10000000)) + ' Crore' + (intNum % 10000000 ? ' ' + this.numberToWords(intNum % 10000000) : '');
    }
    async generateReceiptByReceiptNo(receiptNo) {
        const transaction = await this.prisma.feeTransaction.findUnique({
            where: { receiptNo },
        });
        if (!transaction) {
            throw new Error('Receipt not found');
        }
        return this.generateReceipt(transaction.id);
    }
};
exports.ReceiptPdfService = ReceiptPdfService;
exports.ReceiptPdfService = ReceiptPdfService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReceiptPdfService);
//# sourceMappingURL=receipt-pdf.service.js.map