import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { RoleSettingsService } from './role-settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('role-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoleSettingsController {
    constructor(private readonly roleSettingsService: RoleSettingsService) { }

    /**
     * GET /role-settings
     * Get enabled roles for dropdowns (accessible by all authenticated users)
     */
    @Get()
    async getEnabledRoles() {
        return this.roleSettingsService.getEnabledRoles();
    }

    /**
     * GET /role-settings/admin
     * Get all roles with settings (admin only)
     */
    @Get('admin')
    @Roles('SUPER_ADMIN', 'ADMIN', 'PRINCIPAL')
    async getAllRoles() {
        return this.roleSettingsService.getAllRoles();
    }

    /**
     * PATCH /role-settings/:role
     * Update a single role's settings
     */
    @Patch(':role')
    @Roles('SUPER_ADMIN', 'ADMIN', 'PRINCIPAL')
    async updateRole(
        @Param('role') role: string,
        @Body() body: {
            isEnabled?: boolean;
            displayName?: string;
            description?: string;
            sortOrder?: number;
        },
    ) {
        return this.roleSettingsService.updateRole(role, body);
    }

    /**
     * PATCH /role-settings/bulk
     * Bulk update multiple roles' enabled status
     */
    @Patch('bulk/update')
    @Roles('SUPER_ADMIN', 'ADMIN', 'PRINCIPAL')
    async bulkUpdateRoles(
        @Body() body: { updates: Array<{ role: string; isEnabled: boolean }> },
    ) {
        return this.roleSettingsService.bulkUpdateRoles(body.updates);
    }
}
