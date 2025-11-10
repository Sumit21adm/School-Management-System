import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ImportStudentsDto } from './dto/import-students.dto';
import { LinkGuardianDto } from './dto/link-guardian.dto';

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

  async create(tenantId: string, createStudentDto: CreateStudentDto) {
    // Check if admission number already exists
    const existingStudent = await this.prisma.student.findFirst({
      where: { tenantId, admissionNo: createStudentDto.admissionNo },
    });

    if (existingStudent) {
      throw new ConflictException('Admission number already exists');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { tenantId, email: createStudentDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Verify section exists if provided
    if (createStudentDto.sectionId) {
      const section = await this.prisma.section.findFirst({
        where: { id: createStudentDto.sectionId, tenantId },
      });
      if (!section) {
        throw new NotFoundException('Section not found');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createStudentDto.password, 10);

    // Create user and student in a transaction
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          email: createStudentDto.email,
          phone: createStudentDto.phone,
          passwordHash,
          firstName: createStudentDto.firstName,
          lastName: createStudentDto.lastName,
          status: 'active',
        },
      });

      const student = await tx.student.create({
        data: {
          tenantId,
          userId: user.id,
          admissionNo: createStudentDto.admissionNo,
          sectionId: createStudentDto.sectionId,
          dob: createStudentDto.dob ? new Date(createStudentDto.dob) : null,
          gender: createStudentDto.gender,
          photo: createStudentDto.photo,
          bloodGroup: createStudentDto.bloodGroup,
          address: createStudentDto.address,
          // customFields: createStudentDto.customFields, // TODO: Add to Prisma schema
          admissionDate: createStudentDto.admissionDate
            ? new Date(createStudentDto.admissionDate)
            : new Date(),
          status: 'active',
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
        },
      });

      return student;
    });

    return result;
  }

  async update(id: string, tenantId: string, updateStudentDto: UpdateStudentDto) {
    const student = await this.prisma.student.findFirst({
      where: { id, tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Verify section exists if provided
    if (updateStudentDto.sectionId) {
      const section = await this.prisma.section.findFirst({
        where: { id: updateStudentDto.sectionId, tenantId },
      });
      if (!section) {
        throw new NotFoundException('Section not found');
      }
    }

    // Update user and student in a transaction
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update user details if provided
      if (updateStudentDto.firstName || updateStudentDto.lastName || updateStudentDto.phone) {
        await tx.user.update({
          where: { id: student.userId },
          data: {
            ...(updateStudentDto.firstName && { firstName: updateStudentDto.firstName }),
            ...(updateStudentDto.lastName && { lastName: updateStudentDto.lastName }),
            ...(updateStudentDto.phone && { phone: updateStudentDto.phone }),
          },
        });
      }

      // Update student details
      const updatedStudent = await tx.student.update({
        where: { id },
        data: {
          ...(updateStudentDto.sectionId !== undefined && { sectionId: updateStudentDto.sectionId }),
          ...(updateStudentDto.dob && { dob: new Date(updateStudentDto.dob) }),
          ...(updateStudentDto.gender && { gender: updateStudentDto.gender }),
          ...(updateStudentDto.photo && { photo: updateStudentDto.photo }),
          ...(updateStudentDto.bloodGroup && { bloodGroup: updateStudentDto.bloodGroup }),
          ...(updateStudentDto.address && { address: updateStudentDto.address }),
          ...(updateStudentDto.customFields && { customFields: updateStudentDto.customFields }),
          ...(updateStudentDto.status && { status: updateStudentDto.status }),
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
        },
      });

      return updatedStudent;
    });

    return result;
  }

  async delete(id: string, tenantId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, tenantId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Delete in transaction (student will cascade, then delete user)
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.student.delete({ where: { id } });
      await tx.user.delete({ where: { id: student.userId } });
    });

    return { message: 'Student deleted successfully' };
  }

  async linkGuardian(studentId: string, tenantId: string, linkGuardianDto: LinkGuardianDto) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const guardian = await this.prisma.guardian.findFirst({
      where: { id: linkGuardianDto.guardianId, tenantId },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Check if link already exists
    const existingLink = await this.prisma.studentGuardian.findFirst({
      where: {
        studentId,
        guardianId: linkGuardianDto.guardianId,
      },
    });

    if (existingLink) {
      throw new ConflictException('Guardian already linked to this student');
    }

    // If this guardian should be primary, unset other primary guardians
    if (linkGuardianDto.isPrimary) {
      await this.prisma.studentGuardian.updateMany({
        where: { studentId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const link = await this.prisma.studentGuardian.create({
      data: {
        studentId,
        guardianId: linkGuardianDto.guardianId,
        relation: linkGuardianDto.relation,
        isPrimary: linkGuardianDto.isPrimary,
      },
      include: {
        guardian: {
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
        },
      },
    });

    return link;
  }

  async unlinkGuardian(studentId: string, guardianId: string, tenantId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const link = await this.prisma.studentGuardian.findFirst({
      where: { studentId, guardianId },
    });

    if (!link) {
      throw new NotFoundException('Guardian link not found');
    }

    await this.prisma.studentGuardian.delete({
      where: { id: link.id },
    });

    return { message: 'Guardian unlinked successfully' };
  }

  async importStudents(tenantId: string, importDto: ImportStudentsDto) {
    const results = {
      success: [] as any[],
      errors: [] as any[],
    };

    for (const studentData of importDto.students) {
      try {
        // Find section by class and section name if provided
        let sectionId: string | undefined;
        if (studentData.className && studentData.sectionName) {
          const section = await this.prisma.section.findFirst({
            where: {
              tenantId,
              name: studentData.sectionName,
              class: {
                name: studentData.className,
              },
            },
          });
          sectionId = section?.id;
        }

        // Create student
        const student = await this.create(tenantId, {
          email: studentData.email,
          password: importDto.defaultPassword,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          phone: studentData.phone,
          admissionNo: studentData.admissionNo,
          dob: studentData.dob,
          gender: studentData.gender as any,
          bloodGroup: studentData.bloodGroup,
          address: studentData.address,
          sectionId,
        });

        results.success.push({
          admissionNo: studentData.admissionNo,
          email: studentData.email,
          studentId: student.id,
        });
      } catch (error) {
        results.errors.push({
          admissionNo: studentData.admissionNo,
          email: studentData.email,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }
}
