import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

@Injectable()
export class ReportCardsService {
  constructor(private prisma: PrismaService) {}

  async generateReportCard(examId: string, studentId: string, tenantId: string): Promise<Buffer> {
    // Fetch exam details
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, tenantId },
      include: {
        academicYear: true,
        papers: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Fetch student details
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
      include: {
        user: true,
        section: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Fetch marks for this student
    const marks = await this.prisma.mark.findMany({
      where: {
        studentId,
        examPaper: {
          examId,
        },
      },
      include: {
        examPaper: {
          include: {
            subject: true,
          },
        },
      },
    });

    // Generate PDF
    return this.createPDF(exam, student, marks);
  }

  private async createPDF(exam: any, student: any, marks: any[]): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Generate QR code for verification
        const verificationData = JSON.stringify({
          examId: exam.id,
          studentId: student.id,
          generatedAt: new Date().toISOString(),
        });
        const qrCodeDataURL = await QRCode.toDataURL(verificationData);

        // Header
        doc.fontSize(24).text('Report Card', { align: 'center' });
        doc.moveDown();

        // School/Institution Info (placeholder)
        doc.fontSize(12).text('School Management System', { align: 'center' });
        doc.moveDown(2);

        // Student Information
        doc.fontSize(14).text('Student Information', { underline: true });
        doc.fontSize(11);
        doc.text(`Name: ${student.user.firstName} ${student.user.lastName}`);
        doc.text(`Admission No: ${student.admissionNo}`);
        doc.text(`Class: ${student.section?.class?.name || 'N/A'} - ${student.section?.name || 'N/A'}`);
        doc.moveDown();

        // Exam Information
        doc.fontSize(14).text('Exam Information', { underline: true });
        doc.fontSize(11);
        doc.text(`Exam: ${exam.name}`);
        doc.text(`Term: ${exam.term}`);
        doc.text(`Academic Year: ${exam.academicYear.name}`);
        doc.moveDown(2);

        // Marks Table
        doc.fontSize(14).text('Marks Details', { underline: true });
        doc.moveDown(0.5);

        // Table headers
        const tableTop = doc.y;
        const col1X = 50;
        const col2X = 250;
        const col3X = 350;
        const col4X = 450;

        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('Subject', col1X, tableTop);
        doc.text('Max Marks', col2X, tableTop);
        doc.text('Obtained', col3X, tableTop);
        doc.text('Grade', col4X, tableTop);
        doc.font('Helvetica');

        let yPos = tableTop + 20;
        let totalMarks = 0;
        let totalObtained = 0;

        marks.forEach((mark) => {
          doc.text(mark.examPaper.subject.name, col1X, yPos);
          doc.text(mark.examPaper.maxMarks.toString(), col2X, yPos);
          doc.text(mark.marks.toString(), col3X, yPos);
          doc.text(mark.grade || 'N/A', col4X, yPos);
          yPos += 20;

          totalMarks += Number(mark.examPaper.maxMarks);
          totalObtained += Number(mark.marks);
        });

        // Total and Percentage
        doc.moveDown();
        yPos += 10;
        doc.font('Helvetica-Bold');
        doc.text('Total:', col1X, yPos);
        doc.text(totalMarks.toString(), col2X, yPos);
        doc.text(totalObtained.toString(), col3X, yPos);
        const percentage = totalMarks > 0 ? ((totalObtained / totalMarks) * 100).toFixed(2) : '0.00';
        doc.text(`${percentage}%`, col4X, yPos);

        // QR Code for verification
        doc.moveDown(3);
        doc.fontSize(10).font('Helvetica');
        doc.text('Verification QR Code:', 50);
        doc.image(qrCodeDataURL, 50, doc.y, { width: 100 });

        doc.moveDown(8);
        doc.fontSize(9).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async getStudentReportCards(studentId: string, tenantId: string) {
    // Verify student belongs to tenant
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get all exams for which this student has marks
    const marks = await this.prisma.mark.findMany({
      where: { studentId },
      include: {
        examPaper: {
          include: {
            exam: {
              include: {
                academicYear: true,
              },
            },
          },
        },
      },
      distinct: ['examPaper.examId' as any],
    });

    // Extract unique exams
    const exams = marks.reduce((acc: any[], mark: any) => {
      const exam = mark.examPaper.exam;
      if (!acc.find((e: any) => e.id === exam.id)) {
        acc.push(exam);
      }
      return acc;
    }, [] as any[]);

    return exams;
  }
}
