import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.class.findMany({
      where: { tenantId },
      include: {
        sections: {
          include: {
            _count: {
              select: { students: true },
            },
          },
        },
        _count: {
          select: { 
            subjects: true,
            sections: true,
          },
        },
      },
      orderBy: {
        gradeLevel: 'asc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.class.findFirst({
      where: { id, tenantId },
      include: {
        sections: {
          include: {
            campus: true,
            students: {
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
        subjects: true,
      },
    });
  }

  async getSubjects(tenantId: string) {
    return this.prisma.subject.findMany({
      where: { tenantId },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
