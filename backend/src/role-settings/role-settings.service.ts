import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

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
     * Get all roles (for admin settings page)
     */
    async getAllRoles() {
        const roles = await this.prisma.roleSettings.findMany({
            orderBy: { sortOrder: 'asc' },
        });
        return roles;
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
            throw new Error('Cannot disable SUPER_ADMIN role');
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
        for (const update of updates) {
            if (update.role === 'SUPER_ADMIN' && !update.isEnabled) continue;

            const result = await this.prisma.roleSettings.update({
                where: { role: update.role },
                data: { isEnabled: update.isEnabled },
            });
            results.push(result);
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
