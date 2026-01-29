import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export interface ValidationError {
    row: number;
    field: string;
    value: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    totalRows: number;
    validRows: number;
    errorCount: number;
    errors: ValidationError[];
    warnings: ValidationError[];
}

export interface ImportReportItem {
    row: number;
    status: 'imported' | 'skipped' | 'failed';
    studentId?: string;
    reason: string;
}

export interface ImportResult {
    success: boolean;
    totalRows: number;
    imported: number;
    skipped: number;
    errors: ValidationError[];
    details?: ImportReportItem[];
}

export interface ImportOptions {
    skipOnError?: boolean;
}

export const dataMigrationService = {
    /**
     * Download complete multi-sheet Excel template
     */
    downloadTemplate: async (): Promise<void> => {
        const response = await axios.get(`${API_URL}/data-migration/templates/complete`, {
            headers: getAuthHeaders(),
            responseType: 'blob',
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'data_migration_template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    /**
     * Validate students import file
     */
    validateStudents: async (file: File): Promise<ValidationResult> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_URL}/data-migration/validate/students`, formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Validate demand bills import file
     */
    validateDemandBills: async (file: File): Promise<ValidationResult> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_URL}/data-migration/validate/demand-bills`, formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Import students from Excel file
     */
    importStudents: async (file: File, options?: ImportOptions): Promise<ImportResult> => {
        const formData = new FormData();
        formData.append('file', file);
        if (options?.skipOnError) {
            formData.append('skipOnError', 'true');
        }

        const response = await axios.post(`${API_URL}/data-migration/import/students`, formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Import fee receipts from Excel file
     */
    importFeeReceipts: async (file: File, options?: ImportOptions): Promise<ImportResult> => {
        const formData = new FormData();
        formData.append('file', file);
        if (options?.skipOnError) {
            formData.append('skipOnError', 'true');
        }

        const response = await axios.post(`${API_URL}/data-migration/import/fee-receipts`, formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Import demand bills from Excel file
     */
    importDemandBills: async (file: File, options?: ImportOptions): Promise<ImportResult> => {
        const formData = new FormData();
        formData.append('file', file);
        if (options?.skipOnError) {
            formData.append('skipOnError', 'true');
        }

        const response = await axios.post(`${API_URL}/data-migration/import/demand-bills`, formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Import discounts from Excel file
     */
    importDiscounts: async (file: File, options?: ImportOptions): Promise<ImportResult> => {
        const formData = new FormData();
        formData.append('file', file);
        if (options?.skipOnError) {
            formData.append('skipOnError', 'true');
        }

        const response = await axios.post(`${API_URL}/data-migration/import/discounts`, formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Import academic history from Excel file
     */
    importAcademicHistory: async (file: File, options?: ImportOptions): Promise<ImportResult> => {
        const formData = new FormData();
        formData.append('file', file);
        if (options?.skipOnError) {
            formData.append('skipOnError', 'true');
        }

        const response = await axios.post(`${API_URL}/data-migration/import/academic-history`, formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
