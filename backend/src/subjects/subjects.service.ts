import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Injectable()
export class SubjectsService {
    constructor(private prisma: PrismaService) { }

    async getAll() {
        return this.prisma.subject.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async getById(id: number) {
        const subject = await this.prisma.subject.findUnique({
            where: { id },
        });
        if (!subject) throw new NotFoundException('Subject not found');
        return subject;
    }

    async create(dto: CreateSubjectDto) {
        try {
            return await this.prisma.subject.create({
                data: dto,
            });
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Subject with this name or code already exists');
            }
            throw error;
        }
    }

    async update(id: number, dto: UpdateSubjectDto) {
        try {
            return await this.prisma.subject.update({
                where: { id },
                data: dto,
            });
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Subject with this name or code already exists');
            }
            throw error;
        }
    }

    async delete(id: number) {
        // Check if used in ClassSubject or ExamSchedule
        const usedInClass = await this.prisma.classSubject.findFirst({
            where: { subjectId: id }
        });

        const usedInExams = await this.prisma.examSchedule.findFirst({
            where: { subjectId: id }
        });

        if (usedInClass || usedInExams) {
            // Soft delete if used
            return this.prisma.subject.update({
                where: { id },
                data: { isActive: false }
            });
        }

        return this.prisma.subject.delete({
            where: { id },
        });
    }
}
