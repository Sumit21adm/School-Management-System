import { apiClient as api } from './api';

export interface BackupFile {
    name: string;
    size: number;
    date: string;
    path: string;
    synced?: boolean;  // Whether synced to cloud
}

export interface BackupListResponse {
    database: BackupFile[];
    files: BackupFile[];
}

export interface CloudStatus {
    configured: boolean;
    connected: boolean;
    email?: string;
    connectedAt?: string;
    credentialsSource?: 'database' | 'environment';
}

export interface CloudCredentials {
    clientId: string | null;
    hasSecret: boolean;
    redirectUri: string | null;
}

export interface BackupSettingsData {
    autoBackup: boolean;
    backupTime: string;
    retentionDays: number;
    gdriveEnabled: boolean;
}

export const backupService = {
    // ============================================
    // LOCAL BACKUP OPERATIONS
    // ============================================

    create: async () => {
        const { data } = await api.post('/backup/create');
        return data;
    },

    list: async (): Promise<BackupListResponse> => {
        const { data } = await api.get('/backup/list');
        return data;
    },

    restore: async (filename: string, type: 'database' | 'files') => {
        const { data } = await api.post('/backup/restore', { filename, type });
        return data;
    },

    delete: async (filename: string, type: 'database' | 'files') => {
        const { data } = await api.delete(`/backup/${type}/${filename}`);
        return data;
    },

    downloadUrl: (type: 'database' | 'files', filename: string) => {
        return `${import.meta.env.VITE_API_URL}/backup/download/${type}/${filename}`;
    },

    // ============================================
    // CLOUD / GOOGLE DRIVE OPERATIONS
    // ============================================

    getCloudStatus: async (): Promise<CloudStatus> => {
        const { data } = await api.get('/backup/cloud/status');
        return data;
    },

    getAuthUrl: async (): Promise<string> => {
        const { data } = await api.get('/backup/cloud/auth-url');
        return data.url;
    },

    syncToCloud: async (filename: string, type: 'database' | 'files') => {
        const { data } = await api.post(`/backup/cloud/sync/${type}/${filename}`);
        return data;
    },

    listCloudBackups: async () => {
        const { data } = await api.get('/backup/cloud/list');
        return data;
    },

    disconnectCloud: async () => {
        const { data } = await api.delete('/backup/cloud/disconnect');
        return data;
    },

    deleteCloudBackup: async (filename: string) => {
        const { data } = await api.delete(`/backup/cloud/${filename}`);
        return data;
    },

    // ============================================
    // CREDENTIALS OPERATIONS (Admin-configured)
    // ============================================

    getCredentials: async (): Promise<CloudCredentials> => {
        const { data } = await api.get('/backup/cloud/credentials');
        return data;
    },

    saveCredentials: async (credentials: {
        clientId: string;
        clientSecret: string;
        redirectUri?: string;
    }) => {
        const { data } = await api.post('/backup/cloud/credentials', credentials);
        return data;
    },

    clearCredentials: async () => {
        const { data } = await api.delete('/backup/cloud/credentials');
        return data;
    },

    // ============================================
    // SETTINGS OPERATIONS
    // ============================================

    getSettings: async (): Promise<BackupSettingsData> => {
        const { data } = await api.get('/backup/settings');
        return data;
    },

    updateSettings: async (settings: Partial<BackupSettingsData>) => {
        const { data } = await api.put('/backup/settings', settings);
        return data;
    },
};
