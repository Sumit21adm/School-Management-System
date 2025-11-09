import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

@Injectable()
export class GuardiansService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.guardian.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
          },
        },
        students: {
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
                    class: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const guardian = await this.prisma.guardian.findFirst({
      where: { id, tenantId },
      include: {
        user: true,
        students: {
          include: {
            student: {
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
                    class: true,
                    campus: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    return guardian;
  }

  async create(tenantId: string, createGuardianDto: CreateGuardianDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { tenantId, email: createGuardianDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createGuardianDto.password, 10);

    // Create user and guardian in a transaction
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          email: createGuardianDto.email,
          phone: createGuardianDto.phone,
          passwordHash,
          firstName: createGuardianDto.firstName,
          lastName: createGuardianDto.lastName,
          status: 'active',
        },
      });

      const guardian = await tx.guardian.create({
        data: {
          tenantId,
          userId: user.id,
          occupation: createGuardianDto.occupation,
          address: createGuardianDto.address,
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
        },
      });

      return guardian;
    });

    return result;
  }

  async update(id: string, tenantId: string, updateGuardianDto: UpdateGuardianDto) {
    const guardian = await this.prisma.guardian.findFirst({
      where: { id, tenantId },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Update user and guardian in a transaction
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update user details if provided
      if (updateGuardianDto.firstName || updateGuardianDto.lastName || updateGuardianDto.phone) {
        await tx.user.update({
          where: { id: guardian.userId },
          data: {
            ...(updateGuardianDto.firstName && { firstName: updateGuardianDto.firstName }),
            ...(updateGuardianDto.lastName && { lastName: updateGuardianDto.lastName }),
            ...(updateGuardianDto.phone && { phone: updateGuardianDto.phone }),
          },
        });
      }

      // Update guardian details
      const updatedGuardian = await tx.guardian.update({
        where: { id },
        data: {
          ...(updateGuardianDto.occupation && { occupation: updateGuardianDto.occupation }),
          ...(updateGuardianDto.address && { address: updateGuardianDto.address }),
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
        },
      });

      return updatedGuardian;
    });

    return result;
  }

  async delete(id: string, tenantId: string) {
    const guardian = await this.prisma.guardian.findFirst({
      where: { id, tenantId },
      include: { user: true },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Delete in transaction (guardian will cascade, then delete user)
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.guardian.delete({ where: { id } });
      await tx.user.delete({ where: { id: guardian.userId } });
    });

    return { message: 'Guardian deleted successfully' };
  }

  async getStats(tenantId: string) {
    const total = await this.prisma.guardian.count({
      where: { tenantId },
    });

    return { total };
  }
}
