import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class StudentsService {
    constructor(private prisma: PrismaService) { }

    async assignRollNumbers(
        classId: number,
        sectionId: number,
        sortBy: 'NAME' | 'ADMISSION_DATE' = 'NAME',
        studentIds?: number[]
    ) {
        // 1. Verify existence
        const sectionData = await this.prisma.section.findUnique({
            where: { id: sectionId },
            include: { class: true }
        });

        if (!sectionData) throw new BadRequestException('Section not found');
        if (sectionData.classId !== classId) throw new BadRequestException('Section does not belong to this class');

        let studentsToUpdate: { id: number }[] = [];

        if (studentIds && studentIds.length > 0) {
            // Manual Order
            // Verify all IDs exist and belong to the section (optional but recommended)
            // For now, simpler approach: just assume IDs are valid or filter valid ones
            // But we need to maintain the ORDER of studentIds.

            // We can treat studentIds as the source of truth for order.
            studentsToUpdate = studentIds.map(id => ({ id }));
        } else {
            // 2. Auto-Sort Fetch
            const orderBy: Prisma.StudentDetailsOrderByWithRelationInput =
                sortBy === 'NAME'
                    ? { name: 'asc' }
                    : { admissionDate: 'asc' };

            const students = await this.prisma.studentDetails.findMany({
                where: {
                    className: sectionData.class.name,
                    section: sectionData.name
                },
                orderBy,
                select: { id: true }
            });

            if (students.length === 0) {
                return { message: 'No students found in this section', count: 0 };
            }
            studentsToUpdate = students;
        }

        // 3. Assign Roll Numbers
        // 3. Assign Roll Numbers
        // To avoid unique constraint violations (e.g. swapping 1 and 2),
        // we first set all target roll numbers to NULL, then assign fresh values.

        const ids = studentsToUpdate.map(s => s.id);

        const nullUpdate = this.prisma.studentDetails.updateMany({
            where: { id: { in: ids } },
            data: { rollNumber: null }
        });

        const updates = studentsToUpdate.map((student, index) => {
            return this.prisma.studentDetails.update({
                where: { id: student.id },
                data: { rollNumber: (index + 1).toString() }
            });
        });

        await this.prisma.$transaction([nullUpdate, ...updates]);

        return {
            message: 'Roll numbers assigned successfully',
            count: studentsToUpdate.length,
            sortBy: studentIds ? 'MANUAL' : sortBy
        };
    }
}
