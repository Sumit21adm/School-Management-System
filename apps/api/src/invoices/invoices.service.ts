import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { BulkGenerateInvoiceDto } from './dto/bulk-generate-invoice.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createInvoiceDto: CreateInvoiceDto) {
    // Verify student exists
    const student = await this.prisma.student.findFirst({
      where: { id: createInvoiceDto.studentId, tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Calculate total
    const total = createInvoiceDto.items.reduce(
      (sum, item) => sum.add(new Decimal(item.amount)),
      new Decimal(0)
    );

    return this.prisma.invoice.create({
      data: {
        tenantId,
        studentId: createInvoiceDto.studentId,
        total,
        dueDate: new Date(createInvoiceDto.dueDate),
        status: 'pending',
        items: {
          create: createInvoiceDto.items.map(item => ({
            feeHeadId: item.feeHeadId,
            amount: new Decimal(item.amount),
          })),
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            section: {
              include: {
                class: true,
              },
            },
          },
        },
        items: {
          include: {
            feeHead: true,
          },
        },
      },
    });
  }

  async bulkGenerate(tenantId: string, bulkGenerateDto: BulkGenerateInvoiceDto) {
    // Fetch the fee plan
    const feePlan = await this.prisma.feePlan.findFirst({
      where: { id: bulkGenerateDto.feePlanId, tenantId },
      include: {
        items: true,
      },
    });

    if (!feePlan) {
      throw new NotFoundException('Fee plan not found');
    }

    // Determine which students to generate invoices for
    let studentQuery: any = {
      tenantId,
      status: 'active',
    };

    if (bulkGenerateDto.studentIds && bulkGenerateDto.studentIds.length > 0) {
      studentQuery.id = { in: bulkGenerateDto.studentIds };
    } else if (bulkGenerateDto.sectionId) {
      studentQuery.sectionId = bulkGenerateDto.sectionId;
    } else if (bulkGenerateDto.classId) {
      // Get all sections for this class
      const sections = await this.prisma.section.findMany({
        where: { classId: bulkGenerateDto.classId, tenantId },
        select: { id: true },
      });
      studentQuery.sectionId = { in: sections.map((s: { id: string }) => s.id) };
    } else {
      throw new BadRequestException('Must specify studentIds, sectionId, or classId');
    }

    const students = await this.prisma.student.findMany({
      where: studentQuery,
    });

    if (students.length === 0) {
      throw new BadRequestException('No students found matching the criteria');
    }

    // Calculate total from fee plan items
    const total = feePlan.items.reduce(
      (sum: Decimal, item: any) => sum.add(item.amount),
      new Decimal(0)
    );

    // Get the first due date from fee plan items (or use a default)
    const dueDate = feePlan.items[0]?.dueDate || new Date(new Date().setMonth(new Date().getMonth() + 1));

    // Generate invoices for each student
    const invoices = await Promise.all(
      students.map((student: any) =>
        this.prisma.invoice.create({
          data: {
            tenantId,
            studentId: student.id,
            total,
            dueDate,
            status: 'pending',
            items: {
              create: feePlan.items.map((item: any) => ({
                feeHeadId: item.feeHeadId,
                amount: item.amount,
              })),
            },
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            items: {
              include: {
                feeHead: true,
              },
            },
          },
        })
      )
    );

    return {
      success: true,
      count: invoices.length,
      invoices,
    };
  }

  async findAll(tenantId: string, filters?: { studentId?: string; status?: string }) {
    return this.prisma.invoice.findMany({
      where: {
        tenantId,
        ...(filters?.studentId && { studentId: filters.studentId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            section: {
              include: {
                class: true,
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
  }

  async findOne(id: string, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        student: {
          include: {
            user: true,
            section: {
              include: {
                class: true,
                campus: true,
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
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async updateStatus(id: string, tenantId: string, status: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(status === 'paid' && { paidAt: new Date() }),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
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
    });
  }

  async getStats(tenantId: string) {
    const total = await this.prisma.invoice.count({
      where: { tenantId },
    });

    const pending = await this.prisma.invoice.count({
      where: { tenantId, status: 'pending' },
    });

    const paid = await this.prisma.invoice.count({
      where: { tenantId, status: 'paid' },
    });

    const overdue = await this.prisma.invoice.count({
      where: {
        tenantId,
        status: { in: ['pending', 'partial'] },
        dueDate: { lt: new Date() },
      },
    });

    const totalAmount = await this.prisma.invoice.aggregate({
      where: { tenantId },
      _sum: { total: true },
    });

    const paidAmount = await this.prisma.invoice.aggregate({
      where: { tenantId, status: 'paid' },
      _sum: { total: true },
    });

    return {
      total,
      pending,
      paid,
      overdue,
      totalAmount: totalAmount._sum.total || new Decimal(0),
      paidAmount: paidAmount._sum.total || new Decimal(0),
    };
  }
}
