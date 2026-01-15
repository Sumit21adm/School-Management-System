import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class RoleSettingsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all enabled roles (for dropdowns in staff/user creation)
     */
    async getEnabledRoles() {
        const roles = await this.prisma.roleSettings.findMany({
            where: { isEnabled: true },
            orderBy: { sortOrder: 'asc' },
            select: {
                role: true,
                displayName: true,
                description: true,
            },
        });
        return roles;
    }

    /**
     * Get all roles with user counts (for admin settings page)
     */
    async getAllRoles() {
        const roles = await this.prisma.roleSettings.findMany({
            orderBy: { sortOrder: 'asc' },
        });

        // Get user counts per role
        const userCounts = await this.prisma.user.groupBy({
            by: ['role'],
            _count: { role: true },
        });

        // Create a map for quick lookup
        const countMap = new Map<string, number>(
            userCounts.map(uc => [uc.role, uc._count.role])
        );

        // Merge user counts into role settings
        return roles.map(role => ({
            ...role,
            userCount: countMap.get(role.role) || 0,
        }));
    }

    /**
     * Get user count for a specific role
     */
    async getUserCountByRole(roleStr: string): Promise<number> {
        const count = await this.prisma.user.count({
            where: { role: roleStr as UserRole },
        });
        return count;
    }

    /**
     * Update role settings (enable/disable, display name, etc.)
     */
    async updateRole(role: string, data: {
        isEnabled?: boolean;
        displayName?: string;
        description?: string;
        sortOrder?: number;
    }) {
        // Prevent disabling SUPER_ADMIN
        if (role === 'SUPER_ADMIN' && data.isEnabled === false) {
            throw new BadRequestException('Cannot disable SUPER_ADMIN role');
        }

        // If trying to disable a role, check for active users
        if (data.isEnabled === false) {
            const userCount = await this.getUserCountByRole(role);
            if (userCount > 0) {
                throw new BadRequestException(
                    `Cannot disable role "${role}" - ${userCount} user(s) currently have this role. Reassign them to another role first.`
                );
            }
        }

        return this.prisma.roleSettings.update({
            where: { role },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Bulk update multiple roles
     */
    async bulkUpdateRoles(updates: Array<{ role: string; isEnabled: boolean }>) {
        const results: Awaited<ReturnType<typeof this.prisma.roleSettings.update>>[] = [];
        const errors: string[] = [];

        for (const update of updates) {
            // Skip SUPER_ADMIN disable
            if (update.role === 'SUPER_ADMIN' && !update.isEnabled) {
                errors.push('Cannot disable SUPER_ADMIN role');
                continue;
            }

            // Check for active users if trying to disable
            if (!update.isEnabled) {
                const userCount = await this.getUserCountByRole(update.role);
                if (userCount > 0) {
                    errors.push(`Cannot disable "${update.role}" - ${userCount} user(s) have this role`);
                    continue;
                }
            }

            const result = await this.prisma.roleSettings.update({
                where: { role: update.role },
                data: { isEnabled: update.isEnabled },
            });
            results.push(result);
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors.join('; '));
        }

        return results;
    }

    /**
     * Check if a role is enabled
     */
    async isRoleEnabled(role: string): Promise<boolean> {
        const setting = await this.prisma.roleSettings.findUnique({
            where: { role },
            select: { isEnabled: true },
        });
        return setting?.isEnabled ?? false;
    }
}

