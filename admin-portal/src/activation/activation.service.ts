import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivationDto, ActivateCodeDto, HeartbeatDto } from './dto';
import * as crypto from 'crypto';

@Injectable()
export class ActivationService {
    constructor(private prisma: PrismaService) { }

    // Generate unique activation code in XXXX-XXXX-XXXX-XXXX format
    private generateCode(): string {
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // No 0, 1, I, O (confusing chars)
        let code = '';
        for (let i = 0; i < 16; i++) {
            if (i > 0 && i % 4 === 0) code += '-';
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Create a new activation code for an organization
    async create(dto: CreateActivationDto, createdBy: number) {
        // Verify organization exists
        const org = await this.prisma.organization.findUnique({
            where: { id: dto.organizationId },
            include: { subscription: { include: { plan: true } } },
        });

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        // Generate unique code
        let code: string;
        let isUnique = false;
        while (!isUnique) {
            code = this.generateCode();
            const existing = await this.prisma.activationCode.findUnique({ where: { code } });
            if (!existing) isUnique = true;
        }

        // Create activation code
        const activation = await this.prisma.activationCode.create({
            data: {
                code: code!,
                organizationId: dto.organizationId,
                maxStudents: dto.maxStudents || org.subscription?.plan?.maxStudents,
                maxUsers: dto.maxUsers || org.subscription?.plan?.maxUsers,
                allowedModules: dto.allowedModules || org.subscription?.plan?.includedModules,
                expiresAt: dto.expiresAt,
                notes: dto.notes,
                createdBy,
            },
            include: {
                organization: { select: { id: true, name: true, slug: true } },
            },
        });

        return activation;
    }

    // Get all activation codes (with optional filters)
    async findAll(params: { organizationId?: number; status?: string; skip?: number; take?: number }) {
        const { organizationId, status, skip = 0, take = 50 } = params;

        const where: any = {};
        if (organizationId) where.organizationId = organizationId;
        if (status) where.status = status;

        const [data, total] = await Promise.all([
            this.prisma.activationCode.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    organization: { select: { id: true, name: true, slug: true } },
                    _count: { select: { heartbeats: true } },
                },
            }),
            this.prisma.activationCode.count({ where }),
        ]);

        return { data, total, skip, take };
    }

    // Get single activation code details
    async findOne(id: number) {
        const activation = await this.prisma.activationCode.findUnique({
            where: { id },
            include: {
                organization: { select: { id: true, name: true, slug: true, email: true } },
                heartbeats: { orderBy: { timestamp: 'desc' }, take: 10 },
            },
        });

        if (!activation) {
            throw new NotFoundException('Activation code not found');
        }

        return activation;
    }

    // Validate activation code (public API - called by school app)
    async validate(code: string) {
        const activation = await this.prisma.activationCode.findUnique({
            where: { code },
            include: {
                organization: {
                    select: { id: true, name: true, slug: true, status: true },
                    include: { subscription: { include: { plan: true, addons: { include: { addon: true } } } } },
                },
            },
        });

        if (!activation) {
            return { valid: false, error: 'INVALID_CODE', message: 'Activation code not found' };
        }

        if (activation.status === 'REVOKED') {
            return { valid: false, error: 'REVOKED', message: 'This activation code has been revoked' };
        }

        if (activation.status === 'EXPIRED' || (activation.expiresAt && new Date(activation.expiresAt) < new Date())) {
            return { valid: false, error: 'EXPIRED', message: 'This activation code has expired' };
        }

        if (activation.organization.status === 'SUSPENDED') {
            return { valid: false, error: 'ORG_SUSPENDED', message: 'Organization account is suspended' };
        }

        // For already-used codes, still return valid for license checks
        return {
            valid: true,
            status: activation.status,
            organization: {
                id: activation.organization.id,
                name: activation.organization.name,
                slug: activation.organization.slug,
            },
            license: {
                maxStudents: activation.maxStudents,
                maxUsers: activation.maxUsers,
                allowedModules: activation.allowedModules ? JSON.parse(activation.allowedModules) : null,
                expiresAt: activation.expiresAt,
                plan: activation.organization.subscription?.plan?.name,
            },
        };
    }

    // Activate code (first-time activation from school app)
    async activate(dto: ActivateCodeDto) {
        const activation = await this.prisma.activationCode.findUnique({
            where: { code: dto.code },
            include: {
                organization: { include: { subscription: { include: { plan: true } } } },
            },
        });

        if (!activation) {
            throw new NotFoundException('Activation code not found');
        }

        if (activation.status === 'REVOKED') {
            throw new BadRequestException('This activation code has been revoked');
        }

        if (activation.status === 'EXPIRED' || (activation.expiresAt && new Date(activation.expiresAt) < new Date())) {
            throw new BadRequestException('This activation code has expired');
        }

        // If already activated, check if same machine
        if (activation.status === 'USED') {
            if (activation.machineId !== dto.machineId) {
                throw new ConflictException('This activation code is already in use on another device');
            }
            // Same machine - return existing activation
            return this.generateActivationToken(activation);
        }

        // Activate the code
        const updated = await this.prisma.activationCode.update({
            where: { id: activation.id },
            data: {
                status: 'USED',
                activatedAt: new Date(),
                activatedIp: dto.ipAddress,
                machineId: dto.machineId,
                instanceName: dto.instanceName,
            },
            include: { organization: { select: { id: true, name: true, slug: true } } },
        });

        return this.generateActivationToken(updated);
    }

    // Generate JWT-like activation token for local storage in school app
    private generateActivationToken(activation: any) {
        const payload = {
            activationId: activation.id,
            organizationId: activation.organizationId,
            organizationSlug: activation.organization.slug,
            maxStudents: activation.maxStudents,
            maxUsers: activation.maxUsers,
            modules: activation.allowedModules ? JSON.parse(activation.allowedModules) : null,
            expiresAt: activation.expiresAt,
            activatedAt: activation.activatedAt,
            machineId: activation.machineId,
        };

        // Create a signed token (simple HMAC for now)
        const secret = process.env.JWT_SECRET || 'activation-secret';
        const payloadStr = JSON.stringify(payload);
        const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

        return {
            token: Buffer.from(payloadStr).toString('base64') + '.' + signature,
            ...payload,
            gracePeriodDays: 7, // How long app works without internet
        };
    }

    // Record heartbeat from school app
    async heartbeat(dto: HeartbeatDto) {
        // Find activation by token or code
        const activation = await this.prisma.activationCode.findFirst({
            where: {
                OR: [{ id: dto.activationId }, { code: dto.code }],
                status: 'USED',
            },
        });

        if (!activation) {
            return { status: 'INVALID', message: 'Activation not found or not active' };
        }

        // Check machine ID matches
        if (activation.machineId && activation.machineId !== dto.machineId) {
            // Possible license cloning detected
            return { status: 'CLONE_DETECTED', message: 'License is in use on another device' };
        }

        // Record heartbeat
        await this.prisma.activationHeartbeat.create({
            data: {
                activationId: activation.id,
                studentCount: dto.studentCount,
                userCount: dto.userCount,
                machineId: dto.machineId,
                ipAddress: dto.ipAddress || '0.0.0.0',
                appVersion: dto.appVersion,
            },
        });

        // Check limits
        const warnings: string[] = [];
        if (activation.maxStudents && dto.studentCount > activation.maxStudents) {
            warnings.push(`Student limit exceeded: ${dto.studentCount}/${activation.maxStudents}`);
        }
        if (activation.maxUsers && dto.userCount > activation.maxUsers) {
            warnings.push(`User limit exceeded: ${dto.userCount}/${activation.maxUsers}`);
        }

        // Check expiry
        if (activation.expiresAt && new Date(activation.expiresAt) < new Date()) {
            return { status: 'EXPIRED', message: 'License has expired' };
        }

        return {
            status: 'OK',
            warnings: warnings.length > 0 ? warnings : undefined,
            nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next heartbeat in 24 hours
        };
    }

    // Revoke activation code
    async revoke(id: number, revokedBy: number, reason?: string) {
        const activation = await this.prisma.activationCode.findUnique({ where: { id } });

        if (!activation) {
            throw new NotFoundException('Activation code not found');
        }

        if (activation.status === 'REVOKED') {
            throw new BadRequestException('Already revoked');
        }

        return this.prisma.activationCode.update({
            where: { id },
            data: {
                status: 'REVOKED',
                revokedAt: new Date(),
                revokedBy,
                revokeReason: reason,
            },
        });
    }

    // Get activation stats for an organization
    async getOrgStats(organizationId: number) {
        const codes = await this.prisma.activationCode.findMany({
            where: { organizationId },
            include: {
                heartbeats: { orderBy: { timestamp: 'desc' }, take: 1 },
            },
        });

        return {
            total: codes.length,
            active: codes.filter((c) => c.status === 'ACTIVE').length,
            used: codes.filter((c) => c.status === 'USED').length,
            revoked: codes.filter((c) => c.status === 'REVOKED').length,
            codes: codes.map((c) => ({
                id: c.id,
                code: c.code,
                status: c.status,
                instanceName: c.instanceName,
                activatedAt: c.activatedAt,
                lastHeartbeat: c.heartbeats[0]?.timestamp,
                studentCount: c.heartbeats[0]?.studentCount,
            })),
        };
    }
}
