import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoutinesService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        // We use upsert to handle both creation and updates for a specific slot
        const { sectionId, sessionId, dayOfWeek, periodNo, subjectId, teacherId } = data;

        return this.prisma.classRoutine.upsert({
            where: {
                sectionId_sessionId_dayOfWeek_periodNo: {
                    sectionId: Number(sectionId),
                    sessionId: Number(sessionId),
                    dayOfWeek,
                    periodNo: Number(periodNo)
                }
            },
            update: {
                subjectId: Number(subjectId),
                teacherId: Number(teacherId)
            },
            create: {
                sectionId: Number(sectionId),
                sessionId: Number(sessionId),
                dayOfWeek,
                periodNo: Number(periodNo),
                subjectId: Number(subjectId),
                teacherId: Number(teacherId)
            },
            include: {
                subject: true,
                teacher: true
            }
        });
    }

    async findAll(sectionId?: number, teacherId?: number) {
        const where: Prisma.ClassRoutineWhereInput = {};
        if (sectionId) where.sectionId = sectionId;
        if (teacherId) where.teacherId = teacherId;

        return this.prisma.classRoutine.findMany({
            where,
            include: {
                section: { include: { class: true } },
                subject: true,
                teacher: true
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { periodNo: 'asc' }
            ]
        });
    }

    async findOne(id: number) {
        return this.prisma.classRoutine.findUnique({
            where: { id },
            include: {
                section: true,
                subject: true,
                teacher: true
            }
        });
    }

    async update(id: number, data: Prisma.ClassRoutineUpdateInput) {
        return this.prisma.classRoutine.update({
            where: { id },
            data,
        });
    }

    async remove(id: number) {
        return this.prisma.classRoutine.delete({
            where: { id },
        });
    }
}
