import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreatePlanDto) {
        return this.prisma.subscriptionPlan.create({
            data: {
                name: dto.name,
                description: dto.description,
                pricePerStudent: dto.pricePerStudent,
                minStudents: dto.minStudents || 1,
                maxStudents: dto.maxStudents,
                baseFeeMonthly: dto.baseFeeMonthly || 0,
                baseFeeYearly: dto.baseFeeYearly || 0,
                yearlyDiscount: dto.yearlyDiscount || 15,
                includedModules: JSON.stringify(dto.includedModules),
                maxUsers: dto.maxUsers,
                isPopular: dto.isPopular || false,
                sortOrder: dto.sortOrder || 0,
            },
        });
    }

    async findAll(includeInactive = false) {
        const where = includeInactive ? {} : { isActive: true };

        return this.prisma.subscriptionPlan.findMany({
            where,
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: { select: { subscriptions: true } },
            },
        });
    }

    async findOne(id: number) {
        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { id },
            include: {
                _count: { select: { subscriptions: true } },
            },
        });

        if (!plan) {
            throw new NotFoundException('Plan not found');
        }

        return {
            ...plan,
            includedModules: JSON.parse(plan.includedModules || '[]'),
        };
    }

    async update(id: number, dto: UpdatePlanDto) {
        await this.findOne(id);

        const data: any = { ...dto };
        if (dto.includedModules) {
            data.includedModules = JSON.stringify(dto.includedModules);
        }

        return this.prisma.subscriptionPlan.update({
            where: { id },
            data,
        });
    }

    async toggleActive(id: number) {
        const plan = await this.findOne(id);

        return this.prisma.subscriptionPlan.update({
            where: { id },
            data: { isActive: !plan.isActive },
        });
    }
}
