import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async login(dto: LoginDto) {
        const user = await this.prisma.adminUser.findUnique({
            where: { email: dto.email },
            include: { organization: true },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.prisma.adminUser.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organization: user.organization ? {
                    id: user.organization.id,
                    name: user.organization.name,
                    slug: user.organization.slug,
                } : null,
            },
        };
    }

    async getProfile(userId: number) {
        const user = await this.prisma.adminUser.findUnique({
            where: { id: userId },
            include: { organization: true },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            organization: user.organization ? {
                id: user.organization.id,
                name: user.organization.name,
                slug: user.organization.slug,
                status: user.organization.status,
            } : null,
        };
    }

    async createSuperAdmin(email: string, password: string, name: string) {
        const hashedPassword = await bcrypt.hash(password, 10);

        return this.prisma.adminUser.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'SUPER_ADMIN',
            },
        });
    }
}
