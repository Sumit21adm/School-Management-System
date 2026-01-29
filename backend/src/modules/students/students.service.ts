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
        studentIds?: number[],
        sessionId?: number
    ) {
        // 1. Verify existence
        const sectionData = await this.prisma.section.findUnique({
            where: { id: sectionId },
            include: { class: true }
        });

        if (!sectionData) throw new BadRequestException('Section not found');
        if (sectionData.classId !== classId) throw new BadRequestException('Section does not belong to this class');

        // If no sessionId provided, try to find active session
        if (!sessionId) {
            const activeSession = await this.prisma.academicSession.findFirst({ where: { isActive: true } });
            if (!activeSession) throw new BadRequestException('No active session found and sessionId not provided');
            sessionId = activeSession.id;
        }

        let studentsToUpdate: { id: number }[] = [];

        if (studentIds && studentIds.length > 0) {
            // Manual Order
            // But we must verify these students belong to the target class/section AND session
            // Otherwise we might accidentally pull a student from another session
            const validatedStudents = await this.prisma.studentDetails.findMany({
                where: {
                    id: { in: studentIds },
                    className: sectionData.class.name,
                    section: sectionData.name,
                    sessionId: sessionId // Scoped to session
                },
                select: { id: true }
            });

            // Map back to original order of IDs provided in studentIds
            // validatedStudents might return in any order
            const validIdSet = new Set(validatedStudents.map(s => s.id));
            studentsToUpdate = studentIds
                .filter(id => validIdSet.has(id))
                .map(id => ({ id }));

        } else {
            // 2. Auto-Sort Fetch
            const orderBy: Prisma.StudentDetailsOrderByWithRelationInput =
                sortBy === 'NAME'
                    ? { name: 'asc' }
                    : { admissionDate: 'asc' };

            const students = await this.prisma.studentDetails.findMany({
                where: {
                    className: sectionData.class.name,
                    section: sectionData.name,
                    sessionId: sessionId // Scoped to session
                },
                orderBy,
                select: { id: true }
            });

            if (students.length === 0) {
                return { message: 'No students found in this section for the selected session', count: 0 };
            }
            studentsToUpdate = students;
        }

        // 3. Assign Roll Numbers
        // To avoid unique constraint violations (e.g. swapping 1 and 2),
        // we first set all target roll numbers to NULL, then assign fresh values.

        // Only touch students in the list (which we've already scoped to session)
        const ids = studentsToUpdate.map(s => s.id);

        if (ids.length === 0) {
            return { message: 'No valid students found to update', count: 0 };
        }

        const nullUpdate = this.prisma.studentDetails.updateMany({
            where: {
                className: sectionData.class.name,
                section: sectionData.name,
                sessionId: sessionId
            },
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
