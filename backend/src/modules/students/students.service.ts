import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class StudentsService {
    constructor(private prisma: PrismaService) { }

    async assignRollNumbers(
        classId: number,
        sectionId: number,
        sortBy: 'NAME' | 'ADMISSION_DATE' = 'NAME'
    ) {
        // 1. Verify existence
        const sectionData = await this.prisma.section.findUnique({
            where: { id: sectionId },
            include: { class: true }
        });

        if (!sectionData) throw new BadRequestException('Section not found');
        if (sectionData.classId !== classId) throw new BadRequestException('Section does not belong to this class');

        // 2. Fetch students
        // Use string fields from sectionData
        const orderBy: Prisma.StudentDetailsOrderByWithRelationInput =
            sortBy === 'NAME'
                ? { name: 'asc' }
                : { admissionDate: 'asc' };

        const students = await this.prisma.studentDetails.findMany({
            where: {
                className: sectionData.class.name,
                section: sectionData.name
            },
            orderBy
        });

        if (students.length === 0) {
            return { message: 'No students found in this section', count: 0 };
        }

        // 3. Assign Roll Numbers
        const updates = students.map((student, index) => {
            return this.prisma.studentDetails.update({
                where: { id: student.id },
                data: { rollNumber: (index + 1).toString() }
            });
        });

        await this.prisma.$transaction(updates);

        return {
            message: 'Roll numbers assigned successfully',
            count: students.length,
            sortBy
        };
    }
}
