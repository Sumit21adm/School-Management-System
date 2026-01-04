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
exports.DemandBillPdfService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const pdfkit_1 = __importDefault(require("pdfkit"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const A6_WIDTH = 297.64;
const A6_HEIGHT = 420.94;
const MARGIN = 12;
const FONTS_DIR = path.join(process.cwd(), 'src/fonts');
const NOTO_REGULAR = path.join(FONTS_DIR, 'NotoSans-Regular.ttf');
const NOTO_BOLD = path.join(FONTS_DIR, 'NotoSans-Bold.ttf');
let DemandBillPdfService = class DemandBillPdfService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateDemandBillPdf(billNo) {
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
            this.drawDemandBillContent(doc, bill, printSettings, fontRegular, fontBold);
            doc.end();
        });
    }
    drawDemandBillContent(doc, bill, settings, fontRegular, fontBold) {
        const contentWidth = A6_WIDTH - 2 * MARGIN;
        doc.rect(MARGIN - 2, MARGIN - 2, contentWidth + 4, A6_HEIGHT - 2 * MARGIN + 4)
            .lineWidth(0.75)
            .stroke('#000000');
        let y = MARGIN;
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
            .text('FEE DEMAND BILL', docTitleX, y + 8 + 5, {
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
        y += 5;
        doc.fontSize(6)
            .font(fontRegular)
            .fillColor('#000000');
        const leftColWidth = contentWidth * 0.55;
        const rightColWidth = contentWidth * 0.45;
        const rightColX = MARGIN + leftColWidth;
        doc.font(fontBold).text('Bill No:', MARGIN, y);
        doc.font(fontRegular).text(bill.billNo, MARGIN + 30, y);
        doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, rightColX, y, { width: rightColWidth, align: 'right' });
        y += 9;
        const period = bill.month && bill.year ? `${new Date(bill.year, bill.month - 1).toLocaleString('default', { month: 'long' })} ${bill.year}` : 'N/A';
        doc.text(`Period: ${period}`, MARGIN, y);
        const dueDate = bill.dueDate ? new Date(bill.dueDate) : new Date();
        doc.text(`Due Date: ${dueDate.toLocaleDateString('en-GB')}`, rightColX, y, { width: rightColWidth, align: 'right' });
        y += 10;
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(0.5).stroke('#CCCCCC');
        doc.lineWidth(1);
        y += 8;
        const infoLeftX = MARGIN;
        const infoRightX = MARGIN + contentWidth / 2;
        const labelWidth = 45;
        doc.font(fontBold).fontSize(6).text('Student ID:', infoLeftX, y);
        doc.font(fontRegular).text(bill.student?.studentId || 'N/A', infoLeftX + labelWidth + 5, y);
        doc.font(fontBold).text('Class:', infoRightX, y);
        doc.font(fontRegular).text(`${bill.student?.className || ''} - ${bill.student?.section || ''}`, infoRightX + 25, y);
        y += 9;
        doc.font(fontBold).text('Name:', infoLeftX, y);
        doc.font(fontRegular).text(bill.student?.name || 'N/A', infoLeftX + labelWidth, y, { width: contentWidth - labelWidth });
        y += 9;
        doc.font(fontBold).text("Father's Name:", infoLeftX, y);
        doc.font(fontRegular).text(bill.student?.fatherName || 'N/A', infoLeftX + 55, y, { width: contentWidth - 55 });
        y += 12;
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(0.5).stroke('#000000');
        doc.lineWidth(1);
        y += 4;
        const col1X = MARGIN + 2;
        const col2X = MARGIN + 100;
        const col3X = MARGIN + 150;
        const col4X = MARGIN + 200;
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
        y += 2;
        doc.moveTo(MARGIN, y).lineTo(A6_WIDTH - MARGIN, y).lineWidth(1).stroke('#000000');
        y += 5;
        const netAmount = totalGross + (previousDues > 0 ? previousDues : 0) - totalItemDiscount;
        doc.fontSize(9)
            .font(fontBold)
            .fillColor('#000000')
            .text('TOTAL DUE:', col1X, y);
        doc.text(`₹ ${netAmount.toFixed(2)}`, col4X - 30, y, { width: 85, align: 'right' });
        y += 12;
        doc.fontSize(7)
            .font(fontBold)
            .fillColor('#000000')
            .text(`Status: ${bill.status.toUpperCase()}`, col1X, y);
        y += 10;
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
        const noteText = settings?.demandBillNote || 'Please pay by the due date to avoid late fees.';
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
    async generateBatchPdf(billNumbers) {
        if (!billNumbers || billNumbers.length === 0) {
            console.error('generateBatchPdf called with empty/null billNumbers');
            throw new Error('No bill numbers provided');
        }
        console.log(`generateBatchPdf: Fetching ${billNumbers.length} bills from DB...`);
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
            bills.forEach((bill, index) => {
                if (index > 0) {
                    doc.addPage();
                }
                this.drawDemandBillContent(doc, bill, printSettings, fontRegular, fontBold);
            });
            doc.end();
        });
    }
};
exports.DemandBillPdfService = DemandBillPdfService;
exports.DemandBillPdfService = DemandBillPdfService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DemandBillPdfService);
//# sourceMappingURL=demand-bill-pdf.service.js.map