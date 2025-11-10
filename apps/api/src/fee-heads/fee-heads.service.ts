import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeHeadDto } from './dto/create-fee-head.dto';
import { UpdateFeeHeadDto } from './dto/update-fee-head.dto';

@Injectable()
export class FeeHeadsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createFeeHeadDto: CreateFeeHeadDto) {
    // Check if fee head with same name already exists
    const existing = await this.prisma.feeHead.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: createFeeHeadDto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Fee head with this name already exists');
    }

    return this.prisma.feeHead.create({
      data: {
        tenantId,
        ...createFeeHeadDto,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.feeHead.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const feeHead = await this.prisma.feeHead.findFirst({
      where: { id, tenantId },
      include: {
        feePlanItems: {
          include: {
            plan: {
              include: {
                class: true,
                academicYear: true,
              },
            },
          },
        },
      },
    });

    if (!feeHead) {
      throw new NotFoundException('Fee head not found');
    }

    return feeHead;
  }

  async update(id: string, tenantId: string, updateFeeHeadDto: UpdateFeeHeadDto) {
    const feeHead = await this.prisma.feeHead.findFirst({
      where: { id, tenantId },
    });

    if (!feeHead) {
      throw new NotFoundException('Fee head not found');
    }

    // Check for name conflict if name is being updated
    if (updateFeeHeadDto.name && updateFeeHeadDto.name !== feeHead.name) {
      const existing = await this.prisma.feeHead.findUnique({
        where: {
          tenantId_name: {
            tenantId,
            name: updateFeeHeadDto.name,
          },
        },
      });

      if (existing) {
        throw new ConflictException('Fee head with this name already exists');
      }
    }

    return this.prisma.feeHead.update({
      where: { id },
      data: updateFeeHeadDto,
    });
  }

  async remove(id: string, tenantId: string) {
    const feeHead = await this.prisma.feeHead.findFirst({
      where: { id, tenantId },
    });

    if (!feeHead) {
      throw new NotFoundException('Fee head not found');
    }

    return this.prisma.feeHead.delete({
      where: { id },
    });
  }
}
