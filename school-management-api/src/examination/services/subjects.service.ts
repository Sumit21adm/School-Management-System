import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from '../dto/examination.dto';

@Injectable()
export class SubjectsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.subject.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: number) {
        const subject = await this.prisma.subject.findUnique({
            where: { id },
        });
        if (!subject) {
            throw new NotFoundException(`Subject with ID ${id} not found`);
        }
        return subject;
    }

    async create(dto: CreateSubjectDto) {
        const existing = await this.prisma.subject.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new ConflictException('Subject with this name already exists');
        }
        if (dto.code) {
            const existingCode = await this.prisma.subject.findUnique({
                where: { code: dto.code },
            });
            if (existingCode) {
                throw new ConflictException('Subject with this code already exists');
            }
        }

        return this.prisma.subject.create({
            data: dto,
        });
    }

    async update(id: number, dto: UpdateSubjectDto) {
        await this.findOne(id);
        return this.prisma.subject.update({
            where: { id },
            data: dto,
        });
    }

    async delete(id: number) {
        await this.findOne(id);
        // Check usage in Exam Schedules
        const usage = await this.prisma.examSchedule.count({ where: { subjectId: id } });
        if (usage > 0) {
            throw new ConflictException('Cannot delete Subject that is used in Exam Schedules');
        }
        return this.prisma.subject.delete({ where: { id } });
    }
}
