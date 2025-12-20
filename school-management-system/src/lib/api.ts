import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Check if online
export const isOnline = () => navigator.onLine;

// API Services
export const dashboardService = {
  getStats: async (period: 'today' | 'week' | 'month' = 'today') => {
    const { data } = await apiClient.get('/dashboard/stats', {
      params: { period },
    });
    return data;
  },
};

export const sessionService = {
  getAll: async (includeInactive: boolean = true) => {
    const { data } = await apiClient.get('/sessions', {
      params: { includeInactive },
    });
    return data;
  },
  getActive: async () => {
    const { data } = await apiClient.get('/sessions/active');
    return data;
  },
  getById: async (id: number) => {
    const { data } = await apiClient.get(`/sessions/${id}`);
    return data;
  },
  create: async (sessionData: any) => {
    const { data } = await apiClient.post('/sessions', sessionData);
    return data;
  },
  update: async (id: number, sessionData: any) => {
    const { data } = await apiClient.put(`/sessions/${id}`, sessionData);
    return data;
  },
  activate: async (id: number) => {
    const { data } = await apiClient.post(`/sessions/${id}/activate`);
    return data;
  },
  delete: async (id: number) => {
    const { data } = await apiClient.delete(`/sessions/${id}`);
    return data;
  },
};

export const feeTypeService = {
  getAll: async (activeOnly: boolean = true) => {
    const { data } = await apiClient.get('/fee-types', {
      params: { activeOnly },
    });
    return data;
  },
  getById: async (id: number) => {
    const { data } = await apiClient.get(`/fee-types/${id}`);
    return data;
  },
  create: async (feeTypeData: any) => {
    const { data } = await apiClient.post('/fee-types', feeTypeData);
    return data;
  },
  update: async (id: number, feeTypeData: any) => {
    const { data } = await apiClient.put(`/fee-types/${id}`, feeTypeData);
    return data;
  },
  delete: async (id: number) => {
    const { data } = await apiClient.delete(`/fee-types/${id}`);
    return data;
  },
};

export const feeStructureService = {
  getStructure: async (sessionId: number, className: string) => {
    const { data } = await apiClient.get(`/fee-structure/${sessionId}/${className}`);
    return data;
  },
  upsertStructure: async (sessionId: number, className: string, structureData: any) => {
    const { data } = await apiClient.put(`/fee-structure/${sessionId}/${className}`, structureData);
    return data;
  },
  copyStructure: async (copyData: any) => {
    const { data } = await apiClient.post('/fee-structure/copy', copyData);
    return data;
  },
};

export const discountService = {
  getByStudent: async (studentId: string, sessionId?: number) => {
    const { data } = await apiClient.get(`/discounts/student/${studentId}`, {
      ...(sessionId && { params: { sessionId } }),
    });
    return data;
  },
  create: async (discountData: any) => {
    const { data } = await apiClient.post('/discounts', discountData);
    return data;
  },
  update: async (id: number, discountData: any) => {
    const { data } = await apiClient.put(`/discounts/${id}`, discountData);
    return data;
  },
  delete: async (id: number) => {
    const { data } = await apiClient.delete(`/discounts/${id}`);
    return data;
  },
};

export const admissionService = {
  createStudent: (data: FormData) => apiClient.post('/admissions', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getStudents: (params: any) => apiClient.get('/admissions', { params }),
  getStudent: (id: string) => apiClient.get(`/admissions/${id}`),
  updateStudent: (id: string, data: FormData) => apiClient.put(`/admissions/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  exportStudents: (params: any) => apiClient.get('/admissions/export', { params, responseType: 'blob' }),
  getDashboardStats: () => apiClient.get('/admissions/dashboard-stats'),
  downloadTemplate: () => apiClient.get('/admissions/template', { responseType: 'blob' }),
  importStudents: (data: FormData) => apiClient.post('/admissions/import', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAvailableSections: (className: string) => apiClient.get(`/admissions/sections/${className}`),
  deleteStudent: (id: number) => apiClient.delete(`/admissions/${id}`),
  restoreStudent: (id: number) => apiClient.patch(`/admissions/${id}/restore`),
};

export const promotionService = {
  preview: async (params: {
    currentSessionId: number;
    className: string;
    section: string;
  }) => {
    const { data } = await apiClient.get('/promotions/preview', { params });
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
    const { data } = await apiClient.post('/promotions/execute', promotionData);
    return data;
  },
};

export const feeService = {
  collectFee: (data: any) => apiClient.post('/fees/collect', data),
  getTransactions: (params?: any) => apiClient.get('/fees/transactions', { params }),
  getReceipt: (receiptNo: string) => apiClient.get(`/fees/receipt/${receiptNo}`),
  getDues: (studentId: string) => apiClient.get(`/fees/dues/${studentId}`),
  getFeeStructure: (classId: string) => apiClient.get(`/fees/structure/${classId}`),
  getReceiptPdfUrl: (receiptNo: string) => `${API_BASE_URL}/fees/receipt/${receiptNo}/pdf`,
  openReceiptPdf: (receiptNo: string) => {
    // Open PDF in new tab
    window.open(`${API_BASE_URL}/fees/receipt/${receiptNo}/pdf`, '_blank');
  },
  getDemandBillPdfUrl: (billNo: string) => `${API_BASE_URL}/fees/demand-bill/${billNo}/pdf`,
  openDemandBillPdf: (billNo: string) => {
    // Open PDF in new tab
    window.open(`${API_BASE_URL}/fees/demand-bill/${billNo}/pdf`, '_blank');
  },
  openBatchDemandBillPdf: (billNumbers: string[], metadata?: { period?: string, billType?: string, classInfo?: string }) => {
    // Use form submission to trigger browser's native file handling
    // This preserves the filename from Content-Disposition header
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${API_BASE_URL}/fees/demand-bills/batch-pdf`;
    form.target = '_blank'; // Open in new tab
    form.style.display = 'none';

    // Add bill numbers as array inputs
    billNumbers.forEach(billNo => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'billNumbers[]'; // express urlencoded extended uses [] for arrays
      input.value = billNo;
      form.appendChild(input);
    });

    // Add metadata fields if provided
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

    // Clean up
    setTimeout(() => {
      document.body.removeChild(form);
    }, 100);
  },
};

export const authService = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
};

export const printSettingsService = {
  get: async () => {
    const { data } = await apiClient.get('/print-settings');
    return data;
  },
  update: async (settingsData: {
    schoolName: string;
    schoolAddress: string;
    phone?: string;
    email?: string;
    website?: string;
    tagline?: string;
  }) => {
    const { data } = await apiClient.put('/print-settings', settingsData);
    return data;
  },
  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    const { data } = await apiClient.post('/print-settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export const examinationService = {
  // Exam Types
  getExamTypes: () => apiClient.get('/exam-types'),
  createExamType: (data: any) => apiClient.post('/exam-types', data),
  updateExamType: (id: number, data: any) => apiClient.put(`/exam-types/${id}`, data),
  deleteExamType: (id: number) => apiClient.delete(`/exam-types/${id}`),

  // Subjects
  getSubjects: () => apiClient.get('/subjects'),
  createSubject: (data: any) => apiClient.post('/subjects', data),
  updateSubject: (id: number, data: any) => apiClient.put(`/subjects/${id}`, data),
  deleteSubject: (id: number) => apiClient.delete(`/subjects/${id}`),

  // Exams
  getExams: (params?: any) => apiClient.get('/exams', { params }),
  getExam: (id: number) => apiClient.get(`/exams/${id}`),
  createExam: (data: any) => apiClient.post('/exams', data),
  updateExam: (id: number, data: any) => apiClient.put(`/exams/${id}`, data),
  deleteExam: (id: number) => apiClient.delete(`/exams/${id}`),
  addSchedule: (examId: number, data: any) => apiClient.post(`/exams/${examId}/schedule`, data),
  deleteSchedule: (scheduleId: number) => apiClient.delete(`/exams/schedule/${scheduleId}`),
};
