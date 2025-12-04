import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDiscountDto, UpdateDiscountDto } from './dto/discount.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DiscountsService {
    constructor(private prisma: PrismaService) { }

    async findByStudent(studentId: string, sessionId?: number) {
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

    async create(createDiscountDto: CreateDiscountDto) {
        const { studentId, feeTypeId, sessionId, discountType, discountValue } = createDiscountDto;

        // Validate discount value
        if (discountType === 'PERCENTAGE' && discountValue > 100) {
            throw new BadRequestException('Percentage discount cannot exceed 100%');
        }

        // Check if discount already exists
        const existing = await this.prisma.studentFeeDiscount.findUnique({
            where: {
                studentId_feeTypeId_sessionId: { studentId, feeTypeId, sessionId },
            },
        });

        if (existing) {
            throw new BadRequestException('Discount already exists for this student, fee type, and session');
        }

        const discount = await this.prisma.studentFeeDiscount.create({
            data: {
                studentId,
                feeTypeId,
                sessionId,
                discountType,
                discountValue: new Decimal(discountValue),
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

    async update(id: number, updateDiscountDto: UpdateDiscountDto) {
        const discount = await this.prisma.studentFeeDiscount.findUnique({
            where: { id },
        });

        if (!discount) {
            throw new NotFoundException('Discount not found');
        }

        // Validate percentage if updating
        if (updateDiscountDto.discountType === 'PERCENTAGE' && updateDiscountDto.discountValue && updateDiscountDto.discountValue > 100) {
            throw new BadRequestException('Percentage discount cannot exceed 100%');
        }

        const updated = await this.prisma.studentFeeDiscount.update({
            where: { id },
            data: {
            }

    await this.prisma.studentFeeDiscount.delete({ where: { id } });
            return { message: 'Discount deleted successfully' };
        }
}
