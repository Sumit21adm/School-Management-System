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

export const examService = {
  createExam: (data: any) => apiClient.post('/exams', data),
  getExams: (params?: any) => apiClient.get('/exams', { params }),
  enterMarks: (examId: string, data: any) => apiClient.post(`/exams/${examId}/marks`, data),
  getResults: (studentId: string) => apiClient.get(`/exams/results/${studentId}`),
  generateReportCard: (studentId: string, examId: string) =>
    apiClient.get(`/exams/report-card/${studentId}/${examId}`, { responseType: 'blob' }),
};

export const transportService = {
  createRoute: (data: any) => apiClient.post('/transport/routes', data),
  getRoutes: () => apiClient.get('/transport/routes'),
  assignStudent: (data: any) => apiClient.post('/transport/assign', data),
  getVehicles: () => apiClient.get('/transport/vehicles'),
};

export const authService = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
};
