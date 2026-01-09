import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SectionsService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.SectionCreateInput) {
        return this.prisma.section.create({
            data,
        });
    }

    async findAll() {
        return this.prisma.section.findMany({
            include: {
                class: true,
                teacherAssignments: {
                    where: { isPrimary: true },
                    include: { teacher: true }
                }
            }
        });
    }

    async findOne(id: number) {
        return this.prisma.section.findUnique({
            where: { id },
            include: {
                class: true,
                teacherAssignments: {
                    include: { teacher: true }
                },
                allocations: {
                    include: { subject: true, teacher: true }
                }
            }
        });
    }

    async update(id: number, data: Prisma.SectionUpdateInput) {
        return this.prisma.section.update({
            where: { id },
            data,
        });
    }

    async remove(id: number) {
        return this.prisma.section.delete({
            where: { id },
        });
    }

    async assignClassTeacher(sectionId: number, teacherId: number, sessionId: number) {
        // 1. Remove existing primary teacher for this session if any
        try {
            await this.prisma.classTeacherAssignment.deleteMany({
                where: {
                    sectionId,
                    sessionId,
                    isPrimary: true
                }
            });
        } catch (e) {
            // Ignore if not found
        }

        // 2. Create new assignment
        return this.prisma.classTeacherAssignment.create({
            data: {
                sectionId,
                teacherId,
                sessionId,
                isPrimary: true
            }
        });
    }

    async assignSubjectTeacher(sectionId: number, subjectId: number, teacherId: number, sessionId: number) {
        // 1. Remove existing allocation for this subject in this section/session
        await this.prisma.subjectTeacherAllocation.deleteMany({
            where: {
                sectionId,
                subjectId,
                sessionId
            }
        });

        // 2. Create new allocation
        return this.prisma.subjectTeacherAllocation.create({
            data: {
                sectionId,
                subjectId,
                teacherId,
                sessionId
            }
        });
    }
}
