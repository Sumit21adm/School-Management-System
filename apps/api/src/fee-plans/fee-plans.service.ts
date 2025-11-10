import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeePlanDto } from './dto/create-fee-plan.dto';
import { UpdateFeePlanDto } from './dto/update-fee-plan.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FeePlansService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createFeePlanDto: CreateFeePlanDto) {
    // Check if fee plan with same name already exists for this class and academic year
    const existing = await this.prisma.feePlan.findUnique({
      where: {
        tenantId_classId_academicYearId_name: {
          tenantId,
          classId: createFeePlanDto.classId,
          academicYearId: createFeePlanDto.academicYearId,
          name: createFeePlanDto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Fee plan with this name already exists for this class and academic year');
    }

    // Create fee plan with items
    return this.prisma.feePlan.create({
      data: {
        tenantId,
        name: createFeePlanDto.name,
        classId: createFeePlanDto.classId,
        academicYearId: createFeePlanDto.academicYearId,
        items: {
          create: createFeePlanDto.items.map(item => ({
            feeHeadId: item.feeHeadId,
            amount: new Decimal(item.amount),
            dueDate: new Date(item.dueDate),
          })),
        },
      },
      include: {
        class: true,
        academicYear: true,
        items: {
          include: {
            feeHead: true,
          },
        },
      },
    });
  }

  async findAll(tenantId: string, filters?: { classId?: string; academicYearId?: string }) {
    return this.prisma.feePlan.findMany({
      where: {
        tenantId,
        ...(filters?.classId && { classId: filters.classId }),
        ...(filters?.academicYearId && { academicYearId: filters.academicYearId }),
      },
      include: {
        class: true,
        academicYear: true,
        items: {
          include: {
            feeHead: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const feePlan = await this.prisma.feePlan.findFirst({
      where: { id, tenantId },
      include: {
        class: true,
        academicYear: true,
        items: {
          include: {
            feeHead: true,
          },
        },
      },
    });

    if (!feePlan) {
      throw new NotFoundException('Fee plan not found');
    }

    return feePlan;
  }

  async update(id: string, tenantId: string, updateFeePlanDto: UpdateFeePlanDto) {
    const feePlan = await this.prisma.feePlan.findFirst({
      where: { id, tenantId },
    });

    if (!feePlan) {
      throw new NotFoundException('Fee plan not found');
    }

    // If items are being updated, delete existing items and create new ones
    if (updateFeePlanDto.items) {
      await this.prisma.feePlanItem.deleteMany({
        where: { planId: id },
      });
    }

    return this.prisma.feePlan.update({
      where: { id },
      data: {
        ...(updateFeePlanDto.name && { name: updateFeePlanDto.name }),
        ...(updateFeePlanDto.items && {
          items: {
            create: updateFeePlanDto.items.map(item => ({
              feeHeadId: item.feeHeadId,
              amount: new Decimal(item.amount),
              dueDate: new Date(item.dueDate),
            })),
          },
        }),
      },
      include: {
        class: true,
        academicYear: true,
        items: {
          include: {
            feeHead: true,
          },
        },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const feePlan = await this.prisma.feePlan.findFirst({
      where: { id, tenantId },
    });

    if (!feePlan) {
      throw new NotFoundException('Fee plan not found');
    }

    return this.prisma.feePlan.delete({
      where: { id },
    });
  }
}
