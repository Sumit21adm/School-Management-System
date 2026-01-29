import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateExamDto, UpdateExamDto, CreateExamScheduleDto } from '../dto/examination.dto';

@Injectable()
export class ExamsService {
    constructor(private prisma: PrismaService) { }

    async findAll(sessionId?: number, status?: string) {
        const where: any = {};
        if (sessionId) where.sessionId = sessionId;
        if (status) where.status = status;

        return this.prisma.exam.findMany({
            where,
            include: {
                examType: true,
                session: true,
                _count: {
                    select: { schedules: true }
                }
            },
            orderBy: { startDate: 'desc' }
        });
    }

    async findOne(id: number) {
        const exam = await this.prisma.exam.findUnique({
            where: { id },
            include: {
                examType: true,
                schedules: {
                    include: {
                        subject: true
                    },
                    orderBy: { date: 'asc' }
                }
            }
        });
        if (!exam) {
            throw new NotFoundException(`Exam with ID ${id} not found`);
        }
        return exam;
    }

    async create(dto: CreateExamDto) {
        const { schedules, ...examData } = dto;

        // Verify dates
        if (new Date(examData.startDate) > new Date(examData.endDate)) {
            throw new BadRequestException('Start date cannot be after End date');
        }

        return this.prisma.$transaction(async (tx) => {
            const exam = await tx.exam.create({
                data: {
                    ...examData,
                    startDate: new Date(examData.startDate),
                    endDate: new Date(examData.endDate),
                    status: 'UPCOMING'
                }
            });

            if (schedules && schedules.length > 0) {
                // Validate schedules
                schedules.forEach(s => {
                    if (!s.period && (!s.startTime || !s.endTime)) {
                        throw new BadRequestException('Either period or time range (start/end) must be provided.');
                    }
                });

                await tx.examSchedule.createMany({
                    data: schedules.map(s => ({
                        examId: exam.id,
                        subjectId: s.subjectId,
                        className: s.className,
                        date: new Date(s.date),
                        startTime: s.startTime ? new Date(s.startTime) : null,
                        endTime: s.endTime ? new Date(s.endTime) : null,
                        roomNo: s.roomNo,
                        period: s.period
                    }))
                });
            }

            return exam;
        });
    }

    async update(id: number, dto: UpdateExamDto) {
        await this.findOne(id);
        return this.prisma.exam.update({
            where: { id },
            data: dto
        });
    }

    async delete(id: number) {
        await this.findOne(id);
        return this.prisma.exam.delete({ where: { id } });
    }

    async addSchedule(examId: number, dto: CreateExamScheduleDto) {
        const exam = await this.findOne(examId);

        // Optional: validation that schedule date is within exam range
        const scheduleDate = new Date(dto.date);
        if (scheduleDate < new Date(exam.startDate) || scheduleDate > new Date(exam.endDate)) {
            // This might be too strict if exams get rescheduled? Let's leave it as a warning or strict check.
            // For robust system, strict check is good.
            // throw new BadRequestException('Schedule date is outside exam duration');
        }

        // Validate Time vs Period
        if (!dto.period && (!dto.startTime || !dto.endTime)) {
            throw new BadRequestException('Either period or time range (start/end) must be provided.');
        }

        return this.prisma.examSchedule.create({
            data: {
                examId,
                subjectId: dto.subjectId,
                className: dto.className,
                date: new Date(dto.date),
                startTime: dto.startTime ? new Date(dto.startTime) : null,
                endTime: dto.endTime ? new Date(dto.endTime) : null,
                roomNo: dto.roomNo,
                period: dto.period
            }
        });
    }

    async deleteSchedule(scheduleId: number) {
        return this.prisma.examSchedule.delete({ where: { id: scheduleId } });
    }
}
