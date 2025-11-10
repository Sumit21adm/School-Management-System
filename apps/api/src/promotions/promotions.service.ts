import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PromoteStudentsDto } from './dto/promote-students.dto';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async promoteStudents(tenantId: string, promoteStudentsDto: PromoteStudentsDto) {
    const { fromClassId, toClassId, academicYearId, minPercentage, examId } = promoteStudentsDto;

    // Verify classes belong to tenant
    const fromClass = await this.prisma.class.findFirst({
      where: { id: fromClassId, tenantId },
    });

    const toClass = await this.prisma.class.findFirst({
      where: { id: toClassId, tenantId },
    });

    if (!fromClass || !toClass) {
      throw new NotFoundException('Class not found');
    }

    // Get all sections of the from class
    const sections = await this.prisma.section.findMany({
      where: {
        classId: fromClassId,
        tenantId,
      },
    });

    const sectionIds = sections.map((s: any) => s.id);

    // Get all students in from class
    const students = await this.prisma.student.findMany({
      where: {
        tenantId,
        sectionId: { in: sectionIds },
        status: 'active',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // If exam-based promotion, filter students based on performance
    let eligibleStudents = students;

    if (examId && minPercentage !== undefined) {
      eligibleStudents = await this.filterStudentsByPerformance(
        students,
        examId,
        minPercentage,
      );
    }

    // Get or create sections in the target class
    const targetSections = await this.prisma.section.findMany({
      where: {
        classId: toClassId,
        tenantId,
      },
    });

    if (targetSections.length === 0) {
      throw new BadRequestException('No sections found in target class');
    }

    // Promote students (distribute them evenly across sections)
    const results = [];
    let sectionIndex = 0;

    for (const student of eligibleStudents) {
      try {
        const targetSection = targetSections[sectionIndex % targetSections.length];

        await this.prisma.student.update({
          where: { id: student.id },
          data: {
            sectionId: targetSection.id,
          },
        });

        results.push({
          success: true,
          studentId: student.id,
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          newSection: targetSection.name,
        });

        sectionIndex++;
      } catch (error: any) {
        results.push({
          success: false,
          studentId: student.id,
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          error: error.message,
        });
      }
    }

    return {
      totalStudents: students.length,
      eligibleStudents: eligibleStudents.length,
      promoted: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      details: results,
    };
  }

  private async filterStudentsByPerformance(
    students: any[],
    examId: string,
    minPercentage: number,
  ) {
    const eligibleStudents = [];

    for (const student of students) {
      // Get student's marks for this exam
      const marks = await this.prisma.mark.findMany({
        where: {
          studentId: student.id,
          examPaper: {
            examId,
          },
        },
        include: {
          examPaper: true,
        },
      });

      if (marks.length === 0) {
        continue; // Skip students with no marks
      }

      // Calculate percentage
      let totalMarks = 0;
      let obtainedMarks = 0;

      marks.forEach((mark: any) => {
        totalMarks += Number(mark.examPaper.maxMarks);
        obtainedMarks += Number(mark.marks);
      });

      const percentage = (obtainedMarks / totalMarks) * 100;

      if (percentage >= minPercentage) {
        eligibleStudents.push(student);
      }
    }

    return eligibleStudents;
  }

  async getPromotionPreview(tenantId: string, promoteStudentsDto: PromoteStudentsDto) {
    const { fromClassId, examId, minPercentage } = promoteStudentsDto;

    // Get all sections of the from class
    const sections = await this.prisma.section.findMany({
      where: {
        classId: fromClassId,
        tenantId,
      },
    });

    const sectionIds = sections.map((s: any) => s.id);

    // Get all students in from class
    const students = await this.prisma.student.findMany({
      where: {
        tenantId,
        sectionId: { in: sectionIds },
        status: 'active',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    let eligibleStudents = students;

    if (examId && minPercentage !== undefined) {
      eligibleStudents = await this.filterStudentsByPerformance(
        students,
        examId,
        minPercentage,
      );
    }

    return {
      totalStudents: students.length,
      eligibleForPromotion: eligibleStudents.length,
      students: eligibleStudents.map((s: any) => ({
        id: s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        admissionNo: s.admissionNo,
      })),
    };
  }
}
