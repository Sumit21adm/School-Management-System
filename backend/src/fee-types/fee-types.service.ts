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

    /**
     * Get fee types that are defined in Fee Structure for a given session and optional class
     * If className provided: returns fee types for that specific class
     * If no className: returns all fee types that have any structure mapping in the session
     */
    async getByStructure(sessionId: number, className?: string) {
        // Build the where clause for fee structure lookup
        const structureWhere: any = { sessionId };
        if (className) {
            structureWhere.className = className;
        }

        // Find fee structures matching criteria
        const structures = await this.prisma.feeStructure.findMany({
            where: structureWhere,
            include: {
                feeItems: {
                    include: {
                        feeType: true,
                    },
                },
            },
        });

        // Collect unique fee types from all matching structures
        const feeTypeMap = new Map<number, any>();
        for (const structure of structures) {
            for (const item of structure.feeItems) {
                if (item.feeType.isActive && !feeTypeMap.has(item.feeType.id)) {
                    feeTypeMap.set(item.feeType.id, {
                        id: item.feeType.id,
                        name: item.feeType.name,
                        description: item.feeType.description,
                        frequency: item.frequency,
                        amount: Number(item.amount),
                        isOptional: item.isOptional,
                    });
                }
            }
        }

        const feeTypes = Array.from(feeTypeMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        return { feeTypes, structureCount: structures.length };
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
                frequency: createFeeTypeDto.frequency || 'Monthly',
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
