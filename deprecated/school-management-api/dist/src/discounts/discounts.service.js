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
exports.DiscountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let DiscountsService = class DiscountsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByStudent(studentId, sessionId) {
        const discounts = await this.prisma.studentFeeDiscount.findMany({
            where: {
                studentId,
                ...(sessionId && { sessionId }),
            },
            include: {
                feeType: true,
                session: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return {
            discounts: discounts.map(d => ({
                id: d.id,
                studentId: d.studentId,
                feeTypeId: d.feeTypeId,
                feeTypeName: d.feeType.name,
                sessionId: d.sessionId,
                sessionName: d.session.name,
                discountType: d.discountType,
                discountValue: Number(d.discountValue),
                reason: d.reason,
                approvedBy: d.approvedBy,
                createdAt: d.createdAt,
            })),
        };
    }
    async create(createDiscountDto) {
        const { studentId, feeTypeId, sessionId, discountType, discountValue } = createDiscountDto;
        if (discountType === 'PERCENTAGE' && discountValue > 100) {
            throw new common_1.BadRequestException('Percentage discount cannot exceed 100%');
        }
        const existing = await this.prisma.studentFeeDiscount.findUnique({
            where: {
                studentId_feeTypeId_sessionId: { studentId, feeTypeId, sessionId },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Discount already exists for this student, fee type, and session');
        }
        const discount = await this.prisma.studentFeeDiscount.create({
            data: {
                studentId,
                feeTypeId,
                sessionId,
                discountType,
                discountValue: new library_1.Decimal(discountValue),
                reason: createDiscountDto.reason,
                approvedBy: createDiscountDto.approvedBy,
            },
            include: {
                feeType: true,
                session: true,
            },
        });
        return {
            ...discount,
            discountValue: Number(discount.discountValue),
        };
    }
    async update(id, updateDiscountDto) {
        const discount = await this.prisma.studentFeeDiscount.findUnique({
            where: { id },
        });
        if (!discount) {
            throw new common_1.NotFoundException('Discount not found');
        }
        if (updateDiscountDto.discountType === 'PERCENTAGE' && updateDiscountDto.discountValue && updateDiscountDto.discountValue > 100) {
            throw new common_1.BadRequestException('Percentage discount cannot exceed 100%');
        }
        const updated = await this.prisma.studentFeeDiscount.update({
            where: { id },
            data: {
                ...(updateDiscountDto.discountType && { discountType: updateDiscountDto.discountType }),
                ...(updateDiscountDto.discountValue !== undefined && { discountValue: new library_1.Decimal(updateDiscountDto.discountValue) }),
                ...(updateDiscountDto.reason !== undefined && { reason: updateDiscountDto.reason }),
                ...(updateDiscountDto.approvedBy !== undefined && { approvedBy: updateDiscountDto.approvedBy }),
            },
            include: {
                feeType: true,
                session: true,
            },
        });
        return {
            ...updated,
            discountValue: Number(updated.discountValue),
        };
    }
    async delete(id) {
        const discount = await this.prisma.studentFeeDiscount.findUnique({
            where: { id },
        });
        if (!discount) {
            throw new common_1.NotFoundException('Discount not found');
        }
        await this.prisma.studentFeeDiscount.delete({ where: { id } });
        return { message: 'Discount deleted successfully' };
    }
};
exports.DiscountsService = DiscountsService;
exports.DiscountsService = DiscountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DiscountsService);
//# sourceMappingURL=discounts.service.js.map