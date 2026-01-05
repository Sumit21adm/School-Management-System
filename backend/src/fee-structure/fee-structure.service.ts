import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpsertFeeStructureDto, CopyFeeStructureDto } from './dto/fee-structure.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FeeStructureService {
    constructor(private prisma: PrismaService) { }

    async getStructure(sessionId: number, className: string) {
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
            // Return empty structure if not found
            const session = await this.prisma.academicSession.findUnique({
                where: { id: sessionId },
            });
            if (!session) {
                throw new NotFoundException('Session not found');
            }
            return {
                sessionId,
                sessionName: session.name,
                className,
                items: [],
                totalAmount: 0,
            };
        }

        const totalAmount = structure.feeItems.reduce(
            (sum, item) => sum + Number(item.amount),
            0
        );

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

    async upsertStructure(sessionId: number, className: string, dto: UpsertFeeStructureDto) {
        // Delete existing structure and items
        await this.prisma.feeStructure.deleteMany({
            where: { sessionId, className },
        });

        // Create new structure with items
        const structure = await this.prisma.feeStructure.create({
            data: {
                sessionId,
                className,
                description: dto.description,
                feeItems: {
                    create: dto.items.map(item => ({
                        feeTypeId: item.feeTypeId,
                        amount: new Decimal(item.amount),
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

    async copyStructure(dto: CopyFeeStructureDto) {
        const { sourceSessionId, targetSessionId, classes, applyPercentageIncrease } = dto;

        // Get all classes if not specified
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
                // Delete existing target structure
                await this.prisma.feeStructure.deleteMany({
                    where: { sessionId: targetSessionId, className },
                });

                // Create new structure
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
                                    amount: new Decimal(amount.toFixed(2)),
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
}
