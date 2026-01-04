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
exports.PromotionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let PromotionsService = class PromotionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async previewPromotion(params) {
        const students = await this.prisma.studentDetails.findMany({
            where: {
                sessionId: params.currentSessionId,
                className: params.className,
                section: params.section,
                status: { not: 'passed' },
            },
            orderBy: { studentId: 'asc' },
        });
        const eligible = students.filter((s) => s.status === 'active');
        const nextClass = await this.calculateNextClass(params.className);
        const isPassoutClass = ['10', '12'].includes(params.className);
        return {
            students,
            meta: {
                total: students.length,
                eligible: eligible.length,
                ineligible: students.length - eligible.length,
                currentClass: params.className,
                nextClass,
                isPassoutClass,
            },
        };
    }
    async executePromotion(dto) {
        const results = {
            success: true,
            promoted: 0,
            failed: 0,
            errors: [],
        };
        for (const studentId of dto.studentIds) {
            try {
                if (dto.markAsPassout) {
                    await this.prisma.studentDetails.update({
                        where: { id: studentId },
                        data: {
                            status: 'passed',
                        },
                    });
                }
                else {
                    const student = await this.prisma.studentDetails.findUnique({
                        where: { id: studentId },
                    });
                    if (!student) {
                        throw new Error(`Student not found: ${studentId}`);
                    }
                    await this.prisma.studentAcademicHistory.create({
                        data: {
                            studentId: student.studentId,
                            sessionId: student.sessionId,
                            className: student.className,
                            section: student.section,
                            status: 'promoted',
                        }
                    });
                    await this.prisma.studentDetails.update({
                        where: { id: studentId },
                        data: {
                            className: dto.nextClass,
                            section: dto.nextSection,
                            sessionId: dto.nextSessionId,
                        },
                    });
                }
                results.promoted++;
            }
            catch (error) {
                results.failed++;
                results.errors.push({
                    studentId,
                    reason: error.message || 'Unknown error',
                });
            }
        }
        if (results.failed > 0) {
            results.success = false;
        }
        return results;
    }
    async calculateNextClass(currentClass) {
        const currentParams = await this.prisma.schoolClass.findUnique({
            where: { name: currentClass }
        });
        if (!currentParams)
            return null;
        const nextClass = await this.prisma.schoolClass.findFirst({
            where: {
                order: {
                    gt: currentParams.order
                }
            },
            orderBy: {
                order: 'asc'
            }
        });
        return nextClass ? nextClass.name : null;
    }
};
exports.PromotionsService = PromotionsService;
exports.PromotionsService = PromotionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PromotionsService);
//# sourceMappingURL=promotions.service.js.map