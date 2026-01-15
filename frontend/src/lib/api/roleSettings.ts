import { apiClient } from '../api';

export interface RoleSettings {
    id: number;
    role: string;
    isEnabled: boolean;
    displayName: string;
    description: string | null;
    sortOrder: number;
    userCount: number; // Number of users with this role
    createdAt: string;
    updatedAt: string;
}

export interface EnabledRole {
    role: string;
    displayName: string;
    description: string | null;
}

export const roleSettingsService = {
    /**
     * Get enabled roles for dropdowns
     */
    getEnabledRoles: async (): Promise<EnabledRole[]> => {
        const res = await apiClient.get<EnabledRole[]>('/role-settings');
        return res.data;
    },

    /**
     * Get all roles with settings (admin only)
     */
    getAllRoles: async (): Promise<RoleSettings[]> => {
        const res = await apiClient.get<RoleSettings[]>('/role-settings/admin');
        return res.data;
    },

    /**
     * Update a single role's settings
     */
    updateRole: async (role: string, data: Partial<RoleSettings>): Promise<RoleSettings> => {
        const res = await apiClient.patch<RoleSettings>(`/role-settings/${role}`, data);
        return res.data;
    },

    /**
     * Bulk update multiple roles' enabled status
     */
    bulkUpdateRoles: async (updates: Array<{ role: string; isEnabled: boolean }>): Promise<RoleSettings[]> => {
        const res = await apiClient.patch<RoleSettings[]>('/role-settings/bulk/update', { updates });
        return res.data;
    },
};
