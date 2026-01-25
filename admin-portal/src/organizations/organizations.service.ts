import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OrganizationsService {
    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) { }

    async create(dto: CreateOrganizationDto) {
        // Generate slug from name
        const slug = this.generateSlug(dto.name);

        // Check if slug exists
        const existing = await this.prisma.organization.findUnique({
            where: { slug },
        });

        if (existing) {
            throw new ConflictException('An organization with similar name already exists');
        }

        // Calculate trial end date (30 days)
        const trialDays = this.config.get<number>('TRIAL_PERIOD_DAYS', 30);
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

        // Create organization with admin user
        const org = await this.prisma.organization.create({
            data: {
                name: dto.name,
                slug,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                city: dto.city,
                state: dto.state,
                country: dto.country || 'India',
                pincode: dto.pincode,
                status: 'TRIAL',
                trialEndsAt,
                // Create org admin user
                adminUsers: dto.adminEmail ? {
                    create: {
                        email: dto.adminEmail,
                        password: await bcrypt.hash(dto.adminPassword || 'admin123', 10),
                        name: dto.adminName || dto.name,
                        role: 'ORG_ADMIN',
                    },
                } : undefined,
            },
            include: {
                adminUsers: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });

        return org;
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        status?: string;
        search?: string;
    }) {
        const { skip = 0, take = 20, status, search } = params;

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { slug: { contains: search } },
            ];
        }

        const [organizations, total] = await Promise.all([
            this.prisma.organization.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    subscription: {
                        include: { plan: true },
                    },
                    _count: {
                        select: { adminUsers: true },
                    },
                },
            }),
            this.prisma.organization.count({ where }),
        ]);

        return {
            data: organizations,
            total,
            page: Math.floor(skip / take) + 1,
            pageSize: take,
            totalPages: Math.ceil(total / take),
        };
    }

    async findOne(id: number) {
        const org = await this.prisma.organization.findUnique({
            where: { id },
            include: {
                subscription: {
                    include: {
                        plan: true,
                        addons: {
                            include: { addon: true },
                        },
                    },
                },
                adminUsers: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        lastLogin: true,
                    },
                },
                invoices: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        return org;
    }

    async findBySlug(slug: string) {
        const org = await this.prisma.organization.findUnique({
            where: { slug },
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        });

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        return org;
    }

    async update(id: number, dto: UpdateOrganizationDto) {
        await this.findOne(id);

        return this.prisma.organization.update({
            where: { id },
            data: dto,
        });
    }

    async updateStatus(id: number, status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED') {
        await this.findOne(id);

        return this.prisma.organization.update({
            where: { id },
            data: { status },
        });
    }

    async updateStudentCount(id: number, count: number) {
        return this.prisma.organization.update({
            where: { id },
            data: { studentCount: count },
        });
    }

    async getDashboardStats() {
        const [totalOrgs, trialOrgs, activeOrgs, suspendedOrgs] = await Promise.all([
            this.prisma.organization.count(),
            this.prisma.organization.count({ where: { status: 'TRIAL' } }),
            this.prisma.organization.count({ where: { status: 'ACTIVE' } }),
            this.prisma.organization.count({ where: { status: 'SUSPENDED' } }),
        ]);

        return {
            total: totalOrgs,
            trial: trialOrgs,
            active: activeOrgs,
            suspended: suspendedOrgs,
        };
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
    }
}
