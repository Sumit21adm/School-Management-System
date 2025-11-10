import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateReportDto, ReportType, ExportFormat } from './dto/generate-report.dto';
import { Parser } from '@json2csv/plainjs';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateReport(tenantId: string, dto: GenerateReportDto): Promise<{ data: Buffer; filename: string; contentType: string }> {
    // Fetch data based on report type
    const data = await this.fetchReportData(tenantId, dto);

    // Generate export based on format
    if (dto.format === ExportFormat.CSV) {
      return this.generateCSV(data, dto.type);
    } else if (dto.format === ExportFormat.PDF) {
      return this.generatePDF(data, dto.type);
    }

    throw new Error('Unsupported format');
  }

  private async fetchReportData(tenantId: string, dto: GenerateReportDto): Promise<any[]> {
    const { type, startDate, endDate, classId, sectionId, status } = dto;

    switch (type) {
      case ReportType.STUDENTS:
        return this.fetchStudentsData(tenantId, { classId, sectionId, status });
      
      case ReportType.ATTENDANCE:
        return this.fetchAttendanceData(tenantId, { startDate, endDate, sectionId });
      
      case ReportType.FEES:
        return this.fetchFeesData(tenantId, { startDate, endDate, status });
      
      case ReportType.EXAMS:
        return this.fetchExamsData(tenantId, { startDate, endDate, classId });
      
      case ReportType.STAFF:
        return this.fetchStaffData(tenantId, { status });
      
      default:
        throw new Error('Unsupported report type');
    }
  }

  private async fetchStudentsData(tenantId: string, filters: any): Promise<any[]> {
    const where: any = { tenantId };
    
    if (filters.sectionId) where.sectionId = filters.sectionId;
    if (filters.status) where.status = filters.status;

    const students = await this.prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        section: {
          include: {
            class: {
              select: {
                name: true,
                gradeLevel: true,
              },
            },
          },
        },
      },
      orderBy: {
        admissionNo: 'asc',
      },
    });

    return students.map((student: any) => ({
      admissionNo: student.admissionNo,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      phone: student.user.phone || 'N/A',
      class: student.section?.class?.name || 'Not Assigned',
      section: student.section?.name || 'Not Assigned',
      status: student.status,
      admissionDate: student.admissionDate.toISOString().split('T')[0],
      gender: student.gender || 'N/A',
      bloodGroup: student.bloodGroup || 'N/A',
    }));
  }

  private async fetchAttendanceData(tenantId: string, filters: any): Promise<any[]> {
    const where: any = { tenantId };
    
    if (filters.startDate) {
      where.date = { gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.date = { ...where.date, lte: new Date(filters.endDate) };
    }
    if (filters.sectionId) where.sectionId = filters.sectionId;

    const attendances = await this.prisma.attendance.findMany({
      where,
      include: {
        section: {
          include: {
            class: {
              select: {
                name: true,
              },
            },
          },
        },
        entries: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const flatData: any[] = [];
    attendances.forEach((attendance: any) => {
      attendance.entries.forEach((entry: any) => {
        flatData.push({
          date: attendance.date.toISOString().split('T')[0],
          class: attendance.section?.class?.name || 'N/A',
          section: attendance.section?.name || 'N/A',
          studentName: `${entry.student.user.firstName} ${entry.student.user.lastName}`,
          admissionNo: entry.student.admissionNo,
          status: entry.status,
          note: entry.note || '',
        });
      });
    });

    return flatData;
  }

  private async fetchFeesData(tenantId: string, filters: any): Promise<any[]> {
    const where: any = { tenantId };
    
    if (filters.status) where.status = filters.status;
    if (filters.startDate) {
      where.createdAt = { gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            section: {
              include: {
                class: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        items: {
          include: {
            feeHead: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invoices.map((invoice: any) => {
      const totalPaid = invoice.payments
        .filter((p: any) => p.status === 'success')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      return {
        invoiceId: invoice.id,
        studentName: `${invoice.student.user.firstName} ${invoice.student.user.lastName}`,
        admissionNo: invoice.student.admissionNo,
        class: invoice.student.section?.class?.name || 'N/A',
        section: invoice.student.section?.name || 'N/A',
        total: Number(invoice.total),
        paid: totalPaid,
        balance: Number(invoice.total) - totalPaid,
        status: invoice.status,
        dueDate: invoice.dueDate.toISOString().split('T')[0],
        feeHeads: invoice.items.map((item: any) => item.feeHead.name).join(', '),
      };
    });
  }

  private async fetchExamsData(tenantId: string, filters: any): Promise<any[]> {
    const where: any = { tenantId };
    
    if (filters.startDate) {
      where.startDate = { gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.endDate = { ...where.endDate, lte: new Date(filters.endDate) };
    }

    const exams = await this.prisma.exam.findMany({
      where,
      include: {
        academicYear: true,
        papers: {
          include: {
            subject: true,
            marks: {
              include: {
                student: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    const flatData: any[] = [];
    exams.forEach((exam: any) => {
      exam.papers.forEach((paper: any) => {
        paper.marks.forEach((mark: any) => {
          flatData.push({
            examName: exam.name,
            term: exam.term,
            academicYear: exam.academicYear.name,
            subject: paper.subject.name,
            studentName: `${mark.student.user.firstName} ${mark.student.user.lastName}`,
            admissionNo: mark.student.admissionNo,
            maxMarks: paper.maxMarks,
            obtainedMarks: Number(mark.marks),
            grade: mark.grade || 'N/A',
            remarks: mark.remarks || '',
          });
        });
      });
    });

    return flatData;
  }

  private async fetchStaffData(tenantId: string, filters: any): Promise<any[]> {
    const where: any = { tenantId };
    
    if (filters.status) where.status = filters.status;

    const staff = await this.prisma.staff.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        empCode: 'asc',
      },
    });

    return staff.map((s: any) => ({
      empCode: s.empCode,
      firstName: s.user.firstName,
      lastName: s.user.lastName,
      email: s.user.email,
      phone: s.user.phone || 'N/A',
      department: s.department || 'N/A',
      designation: s.designation || 'N/A',
      joinDate: s.joinDate.toISOString().split('T')[0],
      status: s.status,
      salary: s.salary ? Number(s.salary) : 'N/A',
    }));
  }

  private async generateCSV(data: any[], reportType: ReportType): Promise<{ data: Buffer; filename: string; contentType: string }> {
    try {
      const parser = new Parser();
      const csv = parser.parse(data);
      
      return {
        data: Buffer.from(csv, 'utf-8'),
        filename: `${reportType}-report-${Date.now()}.csv`,
        contentType: 'text/csv',
      };
    } catch (err) {
      throw new Error(`Error generating CSV: ${err.message}`);
    }
  }

  private async generatePDF(data: any[], reportType: ReportType): Promise<{ data: Buffer; filename: string; contentType: string }> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          resolve({
            data: Buffer.concat(chunks),
            filename: `${reportType}-report-${Date.now()}.pdf`,
            contentType: 'application/pdf',
          });
        });

        // Add title
        doc.fontSize(20).text(`${this.capitalizeFirst(reportType)} Report`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Add data table
        if (data.length === 0) {
          doc.fontSize(14).text('No data available for this report.', { align: 'center' });
        } else {
          // Get column headers
          const headers = Object.keys(data[0]);
          const columnWidth = (doc.page.width - 100) / headers.length;

          // Draw headers
          doc.fontSize(10).font('Helvetica-Bold');
          let xPos = 50;
          headers.forEach(header => {
            doc.text(this.capitalizeFirst(header), xPos, doc.y, { width: columnWidth, align: 'left' });
            xPos += columnWidth;
          });
          doc.moveDown();

          // Draw data rows
          doc.font('Helvetica').fontSize(9);
          data.forEach((row, index) => {
            if (doc.y > doc.page.height - 100) {
              doc.addPage();
            }

            xPos = 50;
            const yPos = doc.y;
            headers.forEach(header => {
              const value = row[header] !== null && row[header] !== undefined ? String(row[header]) : 'N/A';
              doc.text(value.substring(0, 30), xPos, yPos, { width: columnWidth, align: 'left' });
              xPos += columnWidth;
            });
            doc.moveDown(0.5);
          });
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).text(`Total Records: ${data.length}`, 50, doc.page.height - 50, { align: 'left' });

        doc.end();
      } catch (err) {
        reject(new Error(`Error generating PDF: ${err.message}`));
      }
    });
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async getReportTypes(): Promise<string[]> {
    return Object.values(ReportType);
  }
}
