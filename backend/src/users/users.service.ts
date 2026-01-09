import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    // Helper to parse permissions JSON string to array
    private parsePermissions(permissionsJson: string | null): string[] {
        if (!permissionsJson) return [];
        try {
            return JSON.parse(permissionsJson);
        } catch {
            return [];
        }
    }

    // Helper to serialize permissions array to JSON string
    private serializePermissions(permissions: string[] | undefined): string | null {
        if (!permissions || permissions.length === 0) return null;
        return JSON.stringify(permissions);
    }

    async findAll(includeInactive: boolean = false, role?: string) {
        const where: any = includeInactive ? {} : { active: true };
        if (role) {
            where.role = role;
        }

        const users = await this.prisma.user.findMany({
            where,
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                permissions: true,
                active: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
                // Exclude password
            },
            orderBy: { createdAt: 'desc' },
        });

        // Parse permissions for each user
        return {
            users: users.map(user => ({
                ...user,
                permissions: this.parsePermissions(user.permissions),
            })),
        };
    }

    async findOne(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                permissions: true,
                active: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return {
            ...user,
            permissions: this.parsePermissions(user.permissions),
        };
    }

    async create(createUserDto: CreateUserDto) {
        // Check if username already exists
        const existing = await this.prisma.user.findUnique({
            where: { username: createUserDto.username },
        });

        if (existing) {
            throw new ConflictException('Username already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                username: createUserDto.username,
                password: hashedPassword,
                name: createUserDto.name,
                role: createUserDto.role as any,
                email: createUserDto.email,
                phone: createUserDto.phone,
                permissions: this.serializePermissions(createUserDto.permissions),
                active: true,
            },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                permissions: true,
                active: true,
                createdAt: true,
            },
        });

        return {
            ...user,
            permissions: this.parsePermissions(user.permissions),
        };
    }

    async update(id: number, updateUserDto: UpdateUserDto) {
        await this.findOne(id); // Verify user exists

        const updateData: any = {};
        if (updateUserDto.name !== undefined) updateData.name = updateUserDto.name;
        if (updateUserDto.role !== undefined) updateData.role = updateUserDto.role as any;
        if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;
        if (updateUserDto.phone !== undefined) updateData.phone = updateUserDto.phone;
        if (updateUserDto.active !== undefined) updateData.active = updateUserDto.active;
        if (updateUserDto.permissions !== undefined) {
            updateData.permissions = this.serializePermissions(updateUserDto.permissions);
        }

        const user = await this.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                permissions: true,
                active: true,
                updatedAt: true,
            },
        });

        return {
            ...user,
            permissions: this.parsePermissions(user.permissions),
        };
    }

    async changePassword(id: number, changePasswordDto: ChangePasswordDto) {
        await this.findOne(id); // Verify user exists

        const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

        await this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });

        return { message: 'Password changed successfully' };
    }

    async delete(id: number) {
        const user = await this.findOne(id);

        // Prevent deleting the last SUPER_ADMIN
        if (user.role === 'SUPER_ADMIN') {
            const superAdminCount = await this.prisma.user.count({
                where: { role: 'SUPER_ADMIN', active: true },
            });

            if (superAdminCount <= 1) {
                throw new BadRequestException('Cannot delete the last Super Admin user');
            }
        }

        await this.prisma.user.delete({
            where: { id },
        });

        return { message: 'User deleted successfully' };
    }

    async updateLastLogin(id: number) {
        await this.prisma.user.update({
            where: { id },
            data: { lastLogin: new Date() },
        });
    }
}
