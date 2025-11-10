import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateExamPaperDto } from './dto/create-exam-paper.dto';
import { CreateMarkDto, BulkCreateMarksDto } from './dto/create-mark.dto';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  // ============ Exam CRUD ============
  
  async createExam(tenantId: string, createExamDto: CreateExamDto) {
    return this.prisma.exam.create({
      data: {
        tenantId,
        ...createExamDto,
        startDate: createExamDto.startDate ? new Date(createExamDto.startDate) : null,
        endDate: createExamDto.endDate ? new Date(createExamDto.endDate) : null,
        publishAt: createExamDto.publishAt ? new Date(createExamDto.publishAt) : null,
      },
      include: {
        academicYear: true,
        papers: {
          include: {
            subject: true,
          },
        },
      },
    });
  }

  async findAllExams(tenantId: string, academicYearId?: string) {
    return this.prisma.exam.findMany({
      where: {
        tenantId,
        ...(academicYearId && { academicYearId }),
      },
      include: {
        academicYear: true,
        _count: {
          select: { papers: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOneExam(id: string, tenantId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, tenantId },
      include: {
        academicYear: true,
        papers: {
          include: {
            subject: true,
            _count: {
              select: { marks: true },
            },
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    return exam;
  }

  async updateExam(id: string, tenantId: string, updateExamDto: UpdateExamDto) {
    await this.findOneExam(id, tenantId);

    return this.prisma.exam.update({
      where: { id },
      data: {
        ...updateExamDto,
        startDate: updateExamDto.startDate ? new Date(updateExamDto.startDate) : undefined,
        endDate: updateExamDto.endDate ? new Date(updateExamDto.endDate) : undefined,
        publishAt: updateExamDto.publishAt ? new Date(updateExamDto.publishAt) : undefined,
      },
      include: {
        academicYear: true,
        papers: {
          include: {
            subject: true,
          },
        },
      },
    });
  }

  async deleteExam(id: string, tenantId: string) {
    await this.findOneExam(id, tenantId);

    return this.prisma.exam.delete({
      where: { id },
    });
  }

  // ============ Exam Papers ============

  async createExamPaper(tenantId: string, createExamPaperDto: CreateExamPaperDto) {
    // Verify exam belongs to tenant
    const exam = await this.prisma.exam.findFirst({
      where: { id: createExamPaperDto.examId, tenantId },
    });

    if (!exam) {
      throw new NotFoundException(`Exam not found`);
    }

    // Check if paper already exists for this subject
    const existing = await this.prisma.examPaper.findUnique({
      where: {
        examId_subjectId: {
          examId: createExamPaperDto.examId,
          subjectId: createExamPaperDto.subjectId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Paper for this subject already exists in this exam`);
    }

    return this.prisma.examPaper.create({
      data: {
        ...createExamPaperDto,
        date: createExamPaperDto.date ? new Date(createExamPaperDto.date) : null,
      },
      include: {
        subject: true,
        exam: true,
      },
    });
  }

  async findExamPapers(examId: string, tenantId: string) {
    // Verify exam belongs to tenant
    await this.findOneExam(examId, tenantId);

    return this.prisma.examPaper.findMany({
      where: { examId },
      include: {
        subject: true,
        _count: {
          select: { marks: true },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async deleteExamPaper(id: string, tenantId: string) {
    const paper = await this.prisma.examPaper.findUnique({
      where: { id },
      include: { exam: true },
    });

    if (!paper || paper.exam.tenantId !== tenantId) {
      throw new NotFoundException(`Exam paper not found`);
    }

    return this.prisma.examPaper.delete({
      where: { id },
    });
  }

  // ============ Marks ============

  async createMark(tenantId: string, createMarkDto: CreateMarkDto) {
    // Verify paper belongs to tenant
    const paper = await this.prisma.examPaper.findUnique({
      where: { id: createMarkDto.examPaperId },
      include: { exam: true },
    });

    if (!paper || paper.exam.tenantId !== tenantId) {
      throw new NotFoundException(`Exam paper not found`);
    }

    // Validate marks don't exceed maxMarks
    if (createMarkDto.marks > paper.maxMarks) {
      throw new BadRequestException(`Marks cannot exceed ${paper.maxMarks}`);
    }

    // Check if mark already exists
    const existing = await this.prisma.mark.findUnique({
      where: {
        examPaperId_studentId: {
          examPaperId: createMarkDto.examPaperId,
          studentId: createMarkDto.studentId,
        },
      },
    });

    if (existing) {
      // Update existing mark
      return this.prisma.mark.update({
        where: { id: existing.id },
        data: {
          marks: createMarkDto.marks,
          grade: createMarkDto.grade,
          remarks: createMarkDto.remarks,
        },
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
      });
    }

    return this.prisma.mark.create({
      data: createMarkDto,
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
    });
  }

  async bulkCreateMarks(tenantId: string, bulkCreateMarksDto: BulkCreateMarksDto) {
    // Verify paper belongs to tenant
    const paper = await this.prisma.examPaper.findUnique({
      where: { id: bulkCreateMarksDto.examPaperId },
      include: { exam: true },
    });

    if (!paper || paper.exam.tenantId !== tenantId) {
      throw new NotFoundException(`Exam paper not found`);
    }

    const results = [];
    for (const markEntry of bulkCreateMarksDto.marks) {
      // Validate marks
      if (markEntry.marks > paper.maxMarks) {
        throw new BadRequestException(
          `Marks for student ${markEntry.studentId} cannot exceed ${paper.maxMarks}`
        );
      }

      try {
        const mark = await this.createMark(tenantId, {
          examPaperId: bulkCreateMarksDto.examPaperId,
          ...markEntry,
        });
        results.push({ success: true, mark });
      } catch (error) {
        results.push({ success: false, studentId: markEntry.studentId, error: error.message });
      }
    }

    return results;
  }

  async findMarksByPaper(examPaperId: string, tenantId: string) {
    // Verify paper belongs to tenant
    const paper = await this.prisma.examPaper.findUnique({
      where: { id: examPaperId },
      include: { exam: true },
    });

    if (!paper || paper.exam.tenantId !== tenantId) {
      throw new NotFoundException(`Exam paper not found`);
    }

    return this.prisma.mark.findMany({
      where: { examPaperId },
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
      },
      orderBy: {
        student: {
          user: {
            firstName: 'asc',
          },
        },
      },
    });
  }

  async findMarksByStudent(studentId: string, tenantId: string, examId?: string) {
    // Verify student belongs to tenant
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      throw new NotFoundException(`Student not found`);
    }

    return this.prisma.mark.findMany({
      where: {
        studentId,
        ...(examId && {
          examPaper: {
            examId,
          },
        }),
      },
      include: {
        examPaper: {
          include: {
            subject: true,
            exam: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
