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
  getStats: async () => {
    const { data } = await apiClient.get('/dashboard/stats');
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
  downloadTemplate: () => apiClient.get('/admissions/template', { responseType: 'blob' }),
  importStudents: (data: FormData) => apiClient.post('/admissions/import', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAvailableSections: (className: string) => apiClient.get(`/admissions/sections/${className}`),
  deleteStudent: (id: number) => apiClient.delete(`/admissions/${id}`),
};

export const feeService = {
  collectFee: (data: any) => apiClient.post('/fees/collect', data),
  getTransactions: (params?: any) => apiClient.get('/fees/transactions', { params }),
  getReceipt: (receiptNo: string) => apiClient.get(`/fees/receipt/${receiptNo}`),
  getDues: (studentId: string) => apiClient.get(`/fees/dues/${studentId}`),
  getFeeStructure: (classId: string) => apiClient.get(`/fees/structure/${classId}`),
};

export const authService = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
};
