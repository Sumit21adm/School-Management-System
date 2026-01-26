
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';
import { AdmitCardService } from './admit-card.service';

// A4 size in points: 595.28 x 841.89
// We can use A4 and put multiple cards or just one per page as per requirement.
// The reference image looks like a standard A4 page or slightly smaller. 
// Let's use A4 standard for now, one card per page to ensure high quality print.
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;

// Font paths
const FONTS_DIR = path.join(process.cwd(), 'src/fonts');
const NOTO_REGULAR = path.join(FONTS_DIR, 'NotoSans-Regular.ttf');
const NOTO_BOLD = path.join(FONTS_DIR, 'NotoSans-Bold.ttf');

@Injectable()
export class AdmitCardPdfService {
    constructor(
        private prisma: PrismaService,
        private admitCardService: AdmitCardService
    ) { }

    async generateAdmitCardsPdf(examId: number, studentIds: string[]): Promise<Buffer> {
        // Fetch print settings
        const printSettings = await this.prisma.printSettings.findFirst();

        // Prepare data for all students
        const cardsData: any[] = [];
        for (const studentId of studentIds) {
            try {
                // Reuse the logic from AdmitCardService to get structured JSON
                const data = await this.admitCardService.generateAdmitCard(examId, studentId);
                cardsData.push(data);
            } catch (e) {
                console.error(`Failed to generate data for student ${studentId}:`, e);
            }
        }

        if (cardsData.length === 0) {
            throw new Error('No valid admit cards could be generated');
        }

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            const doc = new PDFDocument({
                size: 'A4',
                margin: MARGIN,
                autoFirstPage: false
            });

            // Register Fonts
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

            // Draw each card
            cardsData.forEach((data) => {
                doc.addPage();
                this.drawAdmitCard(doc, data, printSettings, fontRegular, fontBold);
            });

            doc.end();
        });
    }

    private drawAdmitCard(doc: PDFKit.PDFDocument, data: any, settings: any, fontRegular: string, fontBold: string) {
        const { header, student, schedule, footer } = data;
        let y = MARGIN;
        const centerX = PAGE_WIDTH / 2;

        // --- BORDER ---
        doc.rect(MARGIN, MARGIN, PAGE_WIDTH - 2 * MARGIN, PAGE_HEIGHT - 2 * MARGIN)
            .lineWidth(1)
            .strokeColor('#000000')
            .stroke();

        // --- HEADER ---
        // Reg No (Left) | ADMIT CARD (Center) | Affiliation (Right)
        doc.fontSize(10).font(fontBold);
        doc.text(`Reg. No- ${student.id}`, MARGIN + 10, y + 10);
        doc.fontSize(14).text('ADMIT CARD', MARGIN, y + 8, { align: 'center', width: PAGE_WIDTH - 2 * MARGIN });
        doc.fontSize(10).text(`Affiliation No-${header.affiliationNo}`, MARGIN, y + 10, { align: 'right', width: PAGE_WIDTH - 2 * MARGIN - 10 });

        y += 40;

        // School Name
        doc.fontSize(20).font(fontBold).text(header.schoolName, MARGIN, y, { align: 'center' });
        y += 25;

        // Address
        doc.fontSize(10).font(fontRegular).text(header.address, MARGIN, y, { align: 'center' });
        y += 15;
        doc.text(`Mob.: ${header.phone}`, MARGIN, y, { align: 'center' });
        y += 25;

        // Exam Type & Session Row
        doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke(); // Top line
        y += 8;
        doc.fontSize(12).font(fontBold);
        doc.text(`Exam. Type: ${header.examType}`, MARGIN + 10, y);
        doc.text(`Year: ${header.session}`, MARGIN, y, { align: 'right', width: PAGE_WIDTH - 2 * MARGIN - 10 });
        y += 20;
        doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).stroke(); // Bottom line
        y += 20;


        // --- STUDENT DETAILS ---
        const leftColX = MARGIN + 20;
        const rightColX = centerX + 20;
        const labelWidth = 100;
        const rowHeight = 20;

        doc.fontSize(10).font(fontRegular);

        const drawDetailRow = (label: string, value: string, x: number, currentY: number) => {
            doc.font(fontBold).text(label, x, currentY);
            doc.font(fontRegular).text(`: ${value}`, x + labelWidth, currentY);
        };

        // Left Column
        drawDetailRow("Student's Id", student.id, leftColX, y);
        drawDetailRow("Student's Name", student.name, rightColX, y);
        y += rowHeight;

        drawDetailRow("Father's Name", student.fatherName, leftColX, y);
        drawDetailRow("Mother's Name", student.motherName, rightColX, y);
        y += rowHeight;

        drawDetailRow("Class", student.class, leftColX, y);
        drawDetailRow("Section", student.section, rightColX, y);
        y += rowHeight;

        drawDetailRow("Roll No.", student.rollNo, leftColX, y);
        drawDetailRow("Exam. Room No.", student.roomNo, rightColX, y);
        y += rowHeight;

        drawDetailRow("Exam. Roll No.", student.examRollNo, leftColX, y);
        y += rowHeight + 10;

        // --- SCHEDULE HEADER ---
        doc.rect(MARGIN, y, PAGE_WIDTH - 2 * MARGIN, 25).fill('#f0f0f0');
        doc.fillColor('#000000').fontSize(12).font(fontBold)
            .text('Exam Schedule', MARGIN, y + 7, { align: 'center', width: PAGE_WIDTH - 2 * MARGIN });
        y += 25;

        // --- SCHEDULE TABLE ---
        const col1W = 120; // Date
        const col2W = (PAGE_WIDTH - 2 * MARGIN - col1W) / 2; // Sitting 1
        const col3W = col2W; // Sitting 2

        // Table Header
        doc.rect(MARGIN, y, col1W, 40).stroke();
        doc.rect(MARGIN + col1W, y, col2W, 40).stroke();
        doc.rect(MARGIN + col1W + col2W, y, col3W, 40).stroke();

        doc.fontSize(10).font(fontBold);
        doc.text('Date', MARGIN, y + 15, { width: col1W, align: 'center' });
        doc.text('First Sitting\n(9:00 a.m to 11:30 a.m)', MARGIN + col1W, y + 8, { width: col2W, align: 'center' });
        doc.text('Second Sitting\n(12:30 p.m to 02:30 p.m)', MARGIN + col1W + col2W, y + 8, { width: col3W, align: 'center' });
        y += 40;

        // Table Rows
        doc.fontSize(10).font(fontRegular);
        schedule.forEach((row: any) => {
            const rowH = 25;
            doc.rect(MARGIN, y, col1W, rowH).stroke();
            doc.rect(MARGIN + col1W, y, col2W, rowH).stroke();
            doc.rect(MARGIN + col1W + col2W, y, col3W, rowH).stroke();

            // Date
            doc.text(new Date(row.date).toLocaleDateString('en-GB'), MARGIN, y + 8, { width: col1W, align: 'center' });

            // Sitting 1
            doc.text(row.firstSitting, MARGIN + col1W, y + 8, { width: col2W, align: 'center' });

            // Sitting 2
            doc.text(row.secondSitting, MARGIN + col1W + col2W, y + 8, { width: col3W, align: 'center' });

            y += rowH;
        });

        y += 20;

        // --- FOOTER INSTRUCTIONS ---
        doc.fontSize(11).font(fontBold).text("Instruction for Student's:-", MARGIN + 10, y);
        y += 15;
        doc.fontSize(9).font(fontRegular);

        footer.instructions.forEach((inst: string) => {
            doc.text(inst, MARGIN + 10, y, { width: PAGE_WIDTH - 2 * MARGIN - 20 });
            y += 12;
        });

        // --- SIGNATURE ---
        const sigY = PAGE_HEIGHT - MARGIN - 50;
        doc.fontSize(10).font(fontBold).text(footer.controllerSignLabel, MARGIN, sigY, { align: 'right', width: PAGE_WIDTH - 2 * MARGIN - 20 });
    }
}
