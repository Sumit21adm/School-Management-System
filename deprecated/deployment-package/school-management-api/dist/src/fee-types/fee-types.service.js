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
exports.FeeTypesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let FeeTypesService = class FeeTypesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(activeOnly = true) {
        const feeTypes = await this.prisma.feeType.findMany({
            where: activeOnly ? { isActive: true } : {},
            orderBy: { name: 'asc' },
        });
        return { feeTypes };
    }
    async findOne(id) {
        const feeType = await this.prisma.feeType.findUnique({
            where: { id },
        });
        if (!feeType) {
            throw new common_1.NotFoundException(`Fee type with ID ${id} not found`);
        }
        return feeType;
    }
    async create(createFeeTypeDto) {
        const existing = await this.prisma.feeType.findUnique({
            where: { name: createFeeTypeDto.name },
        });
        if (existing) {
            throw new common_1.ConflictException('Fee type with this name already exists');
        }
        return this.prisma.feeType.create({
            data: {
                name: createFeeTypeDto.name,
                description: createFeeTypeDto.description,
                isActive: createFeeTypeDto.isActive ?? true,
                isDefault: false,
            },
        });
    }
    async update(id, updateFeeTypeDto) {
        await this.findOne(id);
        if (updateFeeTypeDto.isActive === false) {
            const usageCount = await this.prisma.feeStructureItem.count({
                where: { feeTypeId: id },
            });
            if (usageCount > 0) {
                throw new common_1.BadRequestException('Cannot deactivate fee type that is used in fee structures');
            }
        }
        return this.prisma.feeType.update({
            where: { id },
            data: updateFeeTypeDto,
        });
    }
    async delete(id) {
        const feeType = await this.findOne(id);
        if (feeType.isDefault) {
            throw new common_1.BadRequestException('Cannot delete default fee types');
        }
        const usageCount = await this.prisma.feeStructureItem.count({
            where: { feeTypeId: id },
        });
        if (usageCount > 0) {
            throw new common_1.BadRequestException('Cannot delete fee type that is used in fee structures');
        }
        await this.prisma.feeType.delete({ where: { id } });
        return { message: 'Fee type deleted successfully' };
    }
};
exports.FeeTypesService = FeeTypesService;
exports.FeeTypesService = FeeTypesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FeeTypesService);
//# sourceMappingURL=fee-types.service.js.map