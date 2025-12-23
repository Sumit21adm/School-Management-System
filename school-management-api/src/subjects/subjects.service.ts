import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
    constructor(private prisma: PrismaService) { }

    async create(createSubjectDto: CreateSubjectDto) {
        return this.prisma.subject.create({
            data: createSubjectDto,
        });
    }

    async findAll() {
        return this.prisma.subject.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            include: {
                classSubjects: {
                    include: {
                        class: true,
                    },
                },
            },
        });
    }

    async findOne(id: number) {
        return this.prisma.subject.findUnique({
            where: { id },
            include: {
                classSubjects: {
                    include: {
                        class: true,
                    },
                },
            },
        });
    }

    async update(id: number, updateSubjectDto: UpdateSubjectDto) {
        return this.prisma.subject.update({
            where: { id },
            data: updateSubjectDto,
        });
    }

    async remove(id: number) {
        return this.prisma.subject.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
