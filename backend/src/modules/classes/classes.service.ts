import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ClassesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.schoolClass.findMany({
            orderBy: { order: 'asc' },
            include: {
                sections: true // Include sections count or basic info
            }
        });
    }

    async findOne(id: number) {
        return this.prisma.schoolClass.findUnique({
            where: { id },
            include: { sections: true }
        });
    }


    async create(data: { name: string; displayName: string; order?: number; capacity?: number }) {
        // If order is not provided, set it to last + 1
        if (data.order === undefined) {
            const lastClass = await this.prisma.schoolClass.findFirst({
                orderBy: { order: 'desc' },
            });
            data.order = (lastClass?.order || 0) + 1;
        }

        return this.prisma.schoolClass.create({
            data,
        });
    }

    async update(id: number, data: { name?: string; displayName?: string; capacity?: number; isActive?: boolean }) {
        return this.prisma.schoolClass.update({
            where: { id },
            data,
        });
    }

    async reorder(items: { id: number; order: number }[]) {
        // Use transaction to update multiple records
        return this.prisma.$transaction(
            items.map((item) =>
                this.prisma.schoolClass.update({
                    where: { id: item.id },
                    data: { order: item.order },
                }),
            ),
        );
    }

    async remove(id: number) {
        // Find the class first
        const classToDelete = await this.prisma.schoolClass.findUnique({
            where: { id },
        });

        if (!classToDelete) {
            throw new Error('Class not found');
        }

        // Check for dependencies
        const studentCount = await this.prisma.studentDetails.count({
            where: { className: classToDelete.name },
        });

        if (studentCount > 0) {
            throw new BadRequestException('Cannot delete class because it has assigned students');
        }

        const feeStructureCount = await this.prisma.feeStructure.count({
            where: { className: classToDelete.name },
        });

        if (feeStructureCount > 0) {
            throw new BadRequestException('Cannot delete class because it has associated fee structures');
        }

        const examScheduleCount = await this.prisma.examSchedule.count({
            where: { className: classToDelete.name },
        });

        if (examScheduleCount > 0) {
            throw new BadRequestException('Cannot delete class because it has associated exam schedules');
        }

        return this.prisma.schoolClass.delete({
            where: { id },
        });
    }

    async getSubjects(classId: number) {
        return this.prisma.classSubject.findMany({
            where: { classId },
            include: { subject: true },
            orderBy: { order: 'asc' }
        });
    }

    async assignSubject(classId: number, dto: { subjectId: number; isCompulsory?: boolean; weeklyPeriods?: number; order?: number }) {
        try {
            return await this.prisma.classSubject.create({
                data: {
                    classId,
                    subjectId: dto.subjectId,
                    isCompulsory: dto.isCompulsory ?? true,
                    weeklyPeriods: dto.weeklyPeriods ?? 0,
                    order: dto.order ?? 0
                }
            });
        } catch (error) {
            if (error.code === 'P2002') {
                throw new BadRequestException('Subject already assigned to this class');
            }
            throw error;
        }
    }

    async removeSubject(classId: number, subjectId: number) {
        return this.prisma.classSubject.deleteMany({
            where: {
                classId,
                subjectId
            }
        });
    }
}
