"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
let ExamsService = class ExamsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(sessionId, status) {
        const where = {};
        if (sessionId)
            where.sessionId = sessionId;
        if (status)
            where.status = status;
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
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Exam with ID ${id} not found`);
        }
        return exam;
    }
    async create(dto) {
        const { schedules, ...examData } = dto;
        if (new Date(examData.startDate) > new Date(examData.endDate)) {
            throw new common_1.BadRequestException('Start date cannot be after End date');
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
                await tx.examSchedule.createMany({
                    data: schedules.map(s => ({
                        examId: exam.id,
                        subjectId: s.subjectId,
                        className: s.className,
                        date: new Date(s.date),
                        startTime: new Date(s.startTime),
                        endTime: new Date(s.endTime),
                        roomNo: s.roomNo
                    }))
                });
            }
            return exam;
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.exam.update({
            where: { id },
            data: dto
        });
    }
    async delete(id) {
        await this.findOne(id);
        return this.prisma.exam.delete({ where: { id } });
    }
    async addSchedule(examId, dto) {
        const exam = await this.findOne(examId);
        const scheduleDate = new Date(dto.date);
        if (scheduleDate < new Date(exam.startDate) || scheduleDate > new Date(exam.endDate)) {
        }
        return this.prisma.examSchedule.create({
            data: {
                examId,
                subjectId: dto.subjectId,
                className: dto.className,
                date: new Date(dto.date),
                startTime: new Date(dto.startTime),
                endTime: new Date(dto.endTime),
                roomNo: dto.roomNo
            }
        });
    }
    async deleteSchedule(scheduleId) {
        return this.prisma.examSchedule.delete({ where: { id: scheduleId } });
    }
};
exports.ExamsService = ExamsService;
exports.ExamsService = ExamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExamsService);
//# sourceMappingURL=exams.service.js.map