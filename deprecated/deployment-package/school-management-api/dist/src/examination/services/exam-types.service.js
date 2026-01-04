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
exports.ExamTypesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
let ExamTypesService = class ExamTypesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.examType.findMany({
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id) {
        const examType = await this.prisma.examType.findUnique({
            where: { id },
        });
        if (!examType) {
            throw new common_1.NotFoundException(`Exam Type with ID ${id} not found`);
        }
        return examType;
    }
    async create(dto) {
        const existing = await this.prisma.examType.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new common_1.ConflictException('Exam Type with this name already exists');
        }
        return this.prisma.examType.create({
            data: dto,
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.examType.update({
            where: { id },
            data: dto,
        });
    }
    async delete(id) {
        await this.findOne(id);
        const usage = await this.prisma.exam.count({ where: { examTypeId: id } });
        if (usage > 0) {
            throw new common_1.ConflictException('Cannot delete Exam Type that is being used in Exams');
        }
        return this.prisma.examType.delete({ where: { id } });
    }
};
exports.ExamTypesService = ExamTypesService;
exports.ExamTypesService = ExamTypesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExamTypesService);
//# sourceMappingURL=exam-types.service.js.map