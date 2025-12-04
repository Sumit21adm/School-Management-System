import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateFeeTypeDto, UpdateFeeTypeDto } from './dto/fee-type.dto';

@Injectable()
export class FeeTypesService {
    constructor(private prisma: PrismaService) { }

    async findAll(activeOnly: boolean = true) {
        const feeTypes = await this.prisma.feeType.findMany({
            where: activeOnly ? { isActive: true } : {},
            orderBy: { name: 'asc' },
        });
        return { feeTypes };
    }

    async findOne(id: number) {
        const feeType = await this.prisma.feeType.findUnique({
            where: { id },
        });
        if (!feeType) {
            throw new NotFoundException(`Fee type with ID ${id} not found`);
        }
        return feeType;
    }

    async create(createFeeTypeDto: CreateFeeTypeDto) {
        const existing = await this.prisma.feeType.findUnique({
            where: { name: createFeeTypeDto.name },
        });
        if (existing) {
            throw new ConflictException('Fee type with this name already exists');
        }

        return this.prisma.feeType.create({
            data: {
                name: createFeeTypeDto.name,
                description: createFeeTypeDto.description,
                isActive: createFeeTypeDto.isActive ?? true,
                isDefault: false, // Custom types are never default
            },
        });
    }

    async update(id: number, updateFeeTypeDto: UpdateFeeTypeDto) {
        await this.findOne(id); // Check exists

        // Check if deactivating and used in fee structures
        if (updateFeeTypeDto.isActive === false) {
            const usageCount = await this.prisma.feeStructureItem.count({
                where: { feeTypeId: id },
            });
            if (usageCount > 0) {
                throw new BadRequestException('Cannot deactivate fee type that is used in fee structures');
            }
        }

        return this.prisma.feeType.update({
            where: { id },
            data: updateFeeTypeDto,
        });
    }

    async delete(id: number) {
        const feeType = await this.findOne(id);

        if (feeType.isDefault) {
            throw new BadRequestException('Cannot delete default fee types');
        }

        const usageCount = await this.prisma.feeStructureItem.count({
            where: { feeTypeId: id },
        });
        if (usageCount > 0) {
            throw new BadRequestException('Cannot delete fee type that is used in fee structures');
        }

        await this.prisma.feeType.delete({ where: { id } });
        return { message: 'Fee type deleted successfully' };
    }
}
