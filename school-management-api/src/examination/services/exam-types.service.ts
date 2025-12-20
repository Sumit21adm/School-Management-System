import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateExamTypeDto, UpdateExamTypeDto } from '../dto/examination.dto';

@Injectable()
export class ExamTypesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.examType.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: number) {
        const examType = await this.prisma.examType.findUnique({
            where: { id },
        });
        if (!examType) {
            throw new NotFoundException(`Exam Type with ID ${id} not found`);
        }
        return examType;
    }

    async create(dto: CreateExamTypeDto) {
        const existing = await this.prisma.examType.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new ConflictException('Exam Type with this name already exists');
        }

        return this.prisma.examType.create({
            data: dto,
        });
    }

    async update(id: number, dto: UpdateExamTypeDto) {
        await this.findOne(id);
        return this.prisma.examType.update({
            where: { id },
            data: dto,
        });
    }

    async delete(id: number) {
        await this.findOne(id);
        // Check usage?
        const usage = await this.prisma.exam.count({ where: { examTypeId: id } });
        if (usage > 0) {
            throw new ConflictException('Cannot delete Exam Type that is being used in Exams');
        }
        return this.prisma.examType.delete({ where: { id } });
    }
}
