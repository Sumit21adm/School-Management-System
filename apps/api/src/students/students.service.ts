import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filters?: { sectionId?: string; status?: string }) {
    return this.prisma.student.findMany({
      where: {
        tenantId,
        ...(filters?.sectionId && { sectionId: filters.sectionId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        section: {
          include: {
            class: true,
          },
        },
        guardians: {
          include: {
            guardian: {
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
            },
          },
        },
      },
      orderBy: {
        admissionNo: 'asc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.student.findFirst({
      where: { id, tenantId },
      include: {
        user: true,
        section: {
          include: {
            class: true,
            campus: true,
          },
        },
        guardians: {
          include: {
            guardian: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  async getStats(tenantId: string) {
    const total = await this.prisma.student.count({
      where: { tenantId, status: 'active' },
    });

    const byClass = await this.prisma.student.groupBy({
      by: ['sectionId'],
      where: { tenantId, status: 'active' },
      _count: true,
    });

    return {
      total,
      byClass: byClass.length,
    };
  }
}
