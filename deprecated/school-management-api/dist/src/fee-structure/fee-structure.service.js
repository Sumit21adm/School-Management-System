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
exports.FeeStructureService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let FeeStructureService = class FeeStructureService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStructure(sessionId, className) {
        const structure = await this.prisma.feeStructure.findUnique({
            where: {
                sessionId_className: { sessionId, className },
            },
            include: {
                feeItems: {
                    include: {
                        feeType: true,
                    },
                },
                session: true,
            },
        });
        if (!structure) {
            const session = await this.prisma.academicSession.findUnique({
                where: { id: sessionId },
            });
            if (!session) {
                throw new common_1.NotFoundException('Session not found');
            }
            return {
                sessionId,
                sessionName: session.name,
                className,
                items: [],
                totalAmount: 0,
            };
        }
        const totalAmount = structure.feeItems.reduce((sum, item) => sum + Number(item.amount), 0);
        return {
            id: structure.id,
            sessionId: structure.sessionId,
            sessionName: structure.session.name,
            className: structure.className,
            description: structure.description,
            items: structure.feeItems.map(item => ({
                feeTypeId: item.feeTypeId,
                feeTypeName: item.feeType.name,
                amount: Number(item.amount),
                isOptional: item.isOptional,
                frequency: item.frequency,
            })),
            totalAmount,
        };
    }
    async upsertStructure(sessionId, className, dto) {
        await this.prisma.feeStructure.deleteMany({
            where: { sessionId, className },
        });
        const structure = await this.prisma.feeStructure.create({
            data: {
                sessionId,
                className,
                description: dto.description,
                feeItems: {
                    create: dto.items.map(item => ({
                        feeTypeId: item.feeTypeId,
                        amount: new library_1.Decimal(item.amount),
                        isOptional: item.isOptional ?? false,
                        frequency: item.frequency,
                    })),
                },
            },
            include: {
                feeItems: {
                    include: {
                        feeType: true,
                    },
                },
            },
        });
        return this.getStructure(sessionId, className);
    }
    async copyStructure(dto) {
        const { sourceSessionId, targetSessionId, classes, applyPercentageIncrease } = dto;
        const classesToCopy = classes?.length
            ? classes
            : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
        let copiedCount = 0;
        for (const className of classesToCopy) {
            const sourceStructure = await this.prisma.feeStructure.findUnique({
                where: {
                    sessionId_className: { sessionId: sourceSessionId, className },
                },
                include: {
                    feeItems: true,
                },
            });
            if (sourceStructure) {
                await this.prisma.feeStructure.deleteMany({
                    where: { sessionId: targetSessionId, className },
                });
                await this.prisma.feeStructure.create({
                    data: {
                        sessionId: targetSessionId,
                        className,
                        description: sourceStructure.description,
                        feeItems: {
                            create: sourceStructure.feeItems.map(item => {
                                let amount = Number(item.amount);
                                if (applyPercentageIncrease) {
                                    amount = amount * (1 + applyPercentageIncrease / 100);
                                }
                                return {
                                    feeTypeId: item.feeTypeId,
                                    amount: new library_1.Decimal(amount.toFixed(2)),
                                    isOptional: item.isOptional,
                                };
                            }),
                        },
                    },
                });
                copiedCount++;
            }
        }
        return {
            message: 'Fee structures copied successfully',
            copiedCount,
            classes: classesToCopy.slice(0, copiedCount),
        };
    }
};
exports.FeeStructureService = FeeStructureService;
exports.FeeStructureService = FeeStructureService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FeeStructureService);
//# sourceMappingURL=fee-structure.service.js.map