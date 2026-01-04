import axios from 'axios';

// For Next.js, API routes are internal so we use relative URLs
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('authToken');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// Check if online
export const isOnline = () => typeof navigator !== 'undefined' && navigator.onLine;

// API Services
export const dashboardService = {
    getStats: async (period: 'today' | 'week' | 'month' = 'today', sessionId?: number | null) => {
        const { data } = await apiClient.get('/api/dashboard', {
            params: {
                period,
                ...(sessionId && { sessionId })
            },
        });
        return data;
    },
};

export const sessionService = {
    getAll: async (includeInactive: boolean = true) => {
        const { data } = await apiClient.get('/api/sessions', {
            params: { includeInactive },
        });
        return data;
    },
    getActive: async () => {
        const { data } = await apiClient.get('/api/sessions/active');
        return data;
    },
    getById: async (id: number) => {
        const { data } = await apiClient.get(`/api/sessions/${id}`);
        return data;
    },
    create: async (sessionData: any) => {
        const { data } = await apiClient.post('/api/sessions', sessionData);
        return data;
    },
    update: async (id: number, sessionData: any) => {
        const { data } = await apiClient.put(`/api/sessions/${id}`, sessionData);
        return data;
    },
    activate: async (id: number) => {
        const { data } = await apiClient.patch(`/api/sessions/${id}`);
        return data;
    },
    delete: async (id: number) => {
        const { data } = await apiClient.delete(`/api/sessions/${id}`);
        return data;
    },
};

export const feeTypeService = {
    getAll: async (activeOnly: boolean = true) => {
        const { data } = await apiClient.get('/api/fee-types', {
            params: { activeOnly },
        });
        return data;
    },
    getById: async (id: number) => {
        const { data } = await apiClient.get(`/api/fee-types/${id}`);
        return data;
    },
    create: async (feeTypeData: any) => {
        const { data } = await apiClient.post('/api/fee-types', feeTypeData);
        return data;
    },
    update: async (id: number, feeTypeData: any) => {
        const { data } = await apiClient.put(`/api/fee-types/${id}`, feeTypeData);
        return data;
    },
    delete: async (id: number) => {
        const { data } = await apiClient.delete(`/api/fee-types/${id}`);
        return data;
    },
};

export const feeStructureService = {
    getStructure: async (sessionId: number, className: string) => {
        const { data } = await apiClient.get(`/api/fee-structure/${sessionId}/${className}`);
        return data;
    },
    upsertStructure: async (sessionId: number, className: string, structureData: any) => {
        const { data } = await apiClient.put(`/api/fee-structure/${sessionId}/${className}`, structureData);
        return data;
    },
    copyStructure: async (copyData: any) => {
        const { data } = await apiClient.post('/api/fee-structure/copy', copyData);
        return data;
    },
};

export const discountService = {
    getByStudent: async (studentId: string, sessionId?: number) => {
        const { data } = await apiClient.get(`/api/discounts/student/${studentId}`, {
            ...(sessionId && { params: { sessionId } }),
        });
        return data;
    },
    create: async (discountData: any) => {
        const { data } = await apiClient.post('/api/discounts', discountData);
        return data;
    },
    update: async (id: number, discountData: any) => {
        const { data } = await apiClient.put(`/api/discounts/${id}`, discountData);
        return data;
    },
    delete: async (id: number) => {
        const { data } = await apiClient.delete(`/api/discounts/${id}`);
        return data;
    },
};

export const admissionService = {
    createStudent: (data: FormData) => apiClient.post('/api/students', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getStudents: (params: any) => apiClient.get('/api/students', { params }),
    getStudent: (id: number) => apiClient.get(`/api/students/${id}`),
    updateStudent: (id: number, data: FormData) => apiClient.put(`/api/students/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    exportStudents: (params: any) => apiClient.get('/api/students/export', { params, responseType: 'blob' }),
    getDashboardStats: () => apiClient.get('/api/admissions/stats'),
    downloadTemplate: () => apiClient.get('/api/students/template', { responseType: 'blob' }),
    importStudents: (data: FormData) => apiClient.post('/api/students/import', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getAvailableSections: (className: string) => apiClient.get(`/api/students/sections/${className}`),
    deleteStudent: (id: number) => apiClient.delete(`/api/students/${id}`),
    restoreStudent: (id: number) => apiClient.patch(`/api/students/${id}/restore`),
};

export const promotionService = {
    preview: async (params: {
        currentSessionId: number;
        className: string;
        section: string;
    }) => {
        const { data } = await apiClient.get('/api/promotions', { params });
        return data;
    },
    execute: async (promotionData: {
        studentIds: number[];
        currentSessionId: number;
        nextSessionId: number;
        nextClass: string;
        nextSection: string;
        markAsPassout: boolean;
    }) => {
        const { data } = await apiClient.post('/api/promotions', promotionData);
        return data;
    },
};

export const feeService = {
    collect: async (data: any) => {
        const response = await apiClient.post('/api/fees/collect', data);
        return response.data;
    },
    getTransactions: async (params?: any) => {
        const response = await apiClient.get('/api/fees', { params });
        return response.data;
    },
    getStudentDashboard: async (studentId: string, sessionId: number) => {
        const response = await apiClient.get(`/api/fees/dashboard/${studentId}/session/${sessionId}`);
        return response.data;
    },
    getStatement: async (studentId: string, sessionId: number) => {
        const response = await apiClient.get(`/api/fees/statement/${studentId}`, {
            params: { sessionId },
        });
        return response.data;
    },
    getReceipt: async (receiptNo: string) => {
        const response = await apiClient.get(`/api/fees/receipt/${receiptNo}`);
        return response.data;
    },
    getDues: async (studentId: string) => {
        const response = await apiClient.get(`/api/fees/dues/${studentId}`);
        return response.data;
    },
    getFeeStructure: async (classId: string) => {
        const response = await apiClient.get(`/api/fee-structure?className=${classId}`);
        return response.data;
    },
    getReceiptPdfUrl: (receiptNo: string) => `/api/fees/receipt/${receiptNo}/pdf`,
    openReceiptPdf: (receiptNo: string) => {
        window.open(`/api/fees/receipt/${receiptNo}/pdf`, '_blank');
    },
    getDemandBillPdfUrl: (billNo: string) => `/api/fees/demand-bills/${billNo}/pdf`,
    openDemandBillPdf: (billNo: string) => {
        window.open(`/api/fees/demand-bills/${billNo}/pdf`, '_blank');
    },
    // Demand bill services
    generateDemandBills: async (data: any) => {
        const response = await apiClient.post('/api/fees/demand-bills/generate', data);
        return response.data;
    },
    getDemandBills: async (params?: any) => {
        const response = await apiClient.get('/api/fees/demand-bills', { params });
        return response.data;
    },
    getDemandBill: async (billNo: string) => {
        const response = await apiClient.get(`/api/fees/demand-bills/${billNo}`);
        return response.data;
    },
    openBatchDemandBillPdf: (billNumbers: string[], metadata?: { period?: string, billType?: string, classInfo?: string }) => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/api/fees/demand-bills/batch-pdf`;
        form.target = '_blank';
        form.style.display = 'none';

        billNumbers.forEach(billNo => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'billNumbers[]';
            input.value = billNo;
            form.appendChild(input);
        });

        if (metadata) {
            if (metadata.period) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'period';
                input.value = metadata.period;
                form.appendChild(input);
            }
            if (metadata.billType) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'billType';
                input.value = metadata.billType;
                form.appendChild(input);
            }
            if (metadata.classInfo) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'classInfo';
                input.value = metadata.classInfo;
                form.appendChild(input);
            }
        }

        document.body.appendChild(form);
        form.submit();

        setTimeout(() => {
            document.body.removeChild(form);
        }, 100);
    },
};


export const authService = {
    login: (credentials: { username: string; password: string }) =>
        apiClient.post('/api/auth/login', credentials),
    logout: () => apiClient.post('/api/auth/logout'),
    getCurrentUser: () => apiClient.get('/api/auth/me'),
};

export const printSettingsService = {
    get: async () => {
        const { data } = await apiClient.get('/api/print-settings');
        return data;
    },
    update: async (settingsData: {
        schoolName: string;
        schoolAddress: string;
        phone?: string;
        email?: string;
        website?: string;
        tagline?: string;
        affiliationNo?: string;
        affiliationNote?: string;
        isoCertifiedNote?: string;
        demandBillNote?: string;
        feeReceiptNote?: string;
        admitCardNote?: string;
        transferCertNote?: string;
        idCardNote?: string;
    }) => {
        const { data } = await apiClient.put('/api/print-settings', settingsData);
        return data;
    },
    uploadLogo: async (file: File) => {
        const formData = new FormData();
        formData.append('logo', file);
        const { data } = await apiClient.post('/api/print-settings/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
    deleteLogo: async () => {
        const { data } = await apiClient.delete('/api/print-settings/logo');
        return data;
    },
};

export const examinationService = {
    getExamTypes: () => apiClient.get('/api/exam-types'),
    createExamType: (data: any) => apiClient.post('/api/exam-types', data),
    updateExamType: (id: number, data: any) => apiClient.put(`/api/exam-types/${id}`, data),
    deleteExamType: (id: number) => apiClient.delete(`/api/exam-types/${id}`),

    getSubjects: () => apiClient.get('/api/subjects'),
    createSubject: (data: any) => apiClient.post('/api/subjects', data),
    updateSubject: (id: number, data: any) => apiClient.put(`/api/subjects/${id}`, data),
    deleteSubject: (id: number) => apiClient.delete(`/api/subjects/${id}`),

    getExams: (params?: any) => apiClient.get('/api/exams', { params }),
    getExam: (id: number) => apiClient.get(`/api/exams/${id}`),
    createExam: (data: any) => apiClient.post('/api/exams', data),
    updateExam: (id: number, data: any) => apiClient.put(`/api/exams/${id}`, data),
    deleteExam: (id: number) => apiClient.delete(`/api/exams/${id}`),
    addSchedule: (examId: number, data: any) => apiClient.post(`/api/exams/${examId}/schedule`, data),
    deleteSchedule: (scheduleId: number) => apiClient.delete(`/api/exams/schedule/${scheduleId}`),
};

export const usersService = {
    getAll: async (includeInactive: boolean = false) => {
        const { data } = await apiClient.get('/api/users', {
            params: { includeInactive: includeInactive ? 'true' : 'false' },
        });
        return data;
    },
    getById: async (id: number) => {
        const { data } = await apiClient.get(`/api/users/${id}`);
        return data;
    },
    create: async (userData: {
        username: string;
        password: string;
        name: string;
        role: string;
        email?: string;
        phone?: string;
        permissions?: string[];
    }) => {
        const { data } = await apiClient.post('/api/users', userData);
        return data;
    },
    update: async (id: number, userData: {
        name?: string;
        role?: string;
        email?: string;
        phone?: string;
        active?: boolean;
        permissions?: string[];
    }) => {
        const { data } = await apiClient.put(`/api/users/${id}`, userData);
        return data;
    },
    changePassword: async (id: number, newPassword: string) => {
        const { data } = await apiClient.patch(`/api/users/${id}`, { newPassword });
        return data;
    },
    delete: async (id: number) => {
        const { data } = await apiClient.delete(`/api/users/${id}`);
        return data;
    },
};

export const classService = {
    getAll: async () => {
        const { data } = await apiClient.get('/api/classes');
        return data;
    },
    create: async (classData: any) => {
        const { data } = await apiClient.post('/api/classes', classData);
        return data;
    },
    update: async (id: number, classData: any) => {
        const { data } = await apiClient.patch(`/api/classes/${id}`, classData);
        return data;
    },
    reorder: async (items: any[]) => {
        const { data } = await apiClient.post('/api/classes/reorder', { items });
        return data;
    },
    delete: async (id: number) => {
        const { data } = await apiClient.delete(`/api/classes/${id}`);
        return data;
    },
};

export const subjectService = {
    getAll: async () => {
        const { data } = await apiClient.get('/api/subjects');
        return data;
    },
    create: async (subjectData: any) => {
        const { data } = await apiClient.post('/api/subjects', subjectData);
        return data;
    },
    update: async (id: number, subjectData: any) => {
        const { data } = await apiClient.patch(`/api/subjects/${id}`, subjectData);
        return data;
    },
    delete: async (id: number) => {
        const { data } = await apiClient.delete(`/api/subjects/${id}`);
        return data;
    },
};

export const examService = {
    getAll: async (params?: { sessionId?: number; status?: string }) => {
        const { data } = await apiClient.get('/api/exams', { params });
        return data;
    },
    getById: async (id: number) => {
        const { data } = await apiClient.get(`/api/exams/${id}`);
        return data;
    },
    create: async (examData: any) => {
        const { data } = await apiClient.post('/api/exams', examData);
        return data;
    },
    update: async (id: number, examData: any) => {
        const { data } = await apiClient.put(`/api/exams/${id}`, examData);
        return data;
    },
    delete: async (id: number) => {
        const { data } = await apiClient.delete(`/api/exams/${id}`);
        return data;
    },
    getExamTypes: async () => {
        const { data } = await apiClient.get('/api/exam-types');
        return data;
    },
    createExamType: async (examTypeData: any) => {
        const { data } = await apiClient.post('/api/exam-types', examTypeData);
        return data;
    },
};

export const documentService = {
    getTransferCertificate: (studentId: string) =>
        `/api/documents/transfer-certificate/${studentId}`,
    openTransferCertificate: (studentId: string) => {
        window.open(`/api/documents/transfer-certificate/${studentId}`, '_blank');
    },
    getIdCard: (studentId: string) =>
        `/api/documents/id-card/${studentId}`,
    openIdCard: (studentId: string) => {
        window.open(`/api/documents/id-card/${studentId}`, '_blank');
    },
    getAdmitCard: (studentId: string, examId?: number) => {
        let url = `/api/documents/admit-card/${studentId}`;
        if (examId) url += `?examId=${examId}`;
        return url;
    },
    openAdmitCard: (studentId: string, examId?: number) => {
        let url = `/api/documents/admit-card/${studentId}`;
        if (examId) url += `?examId=${examId}`;
        window.open(url, '_blank');
    },
};

