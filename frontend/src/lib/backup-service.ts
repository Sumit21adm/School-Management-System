import { apiClient as api } from './api';

export interface BackupFile {
    name: string;
    size: number;
    date: string;
    path: string;
}

export interface BackupListResponse {
    database: BackupFile[];
    files: BackupFile[];
}

export const backupService = {
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

    downloadUrl: (type: 'database' | 'files', filename: string) => {
        return `${import.meta.env.VITE_API_URL}/backup/download/${type}/${filename}`;
    },
};
