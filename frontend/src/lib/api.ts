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
    // Don't redirect if it's a login attempt failure
    if (error.response?.status === 401 && !error.config.url?.endsWith('/auth/login')) {
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
  getStudentDashboard: (studentId: string, sessionId: number) => apiClient.get(`/fees/dashboard/${studentId}/session/${sessionId}`),
  generateDemandBills: (data: any) => apiClient.post('/fees/demand-bills/generate', data),
  getStudentStatement: (data: any) => apiClient.post('/fees/statement', data),
  collectFee: (data: any) => apiClient.post('/fees/collect', data),
  getTransactions: (params?: any) => apiClient.get('/fees/transactions', { params }),
  getReceipt: (receiptNo: string) => apiClient.get(`/fees/receipt/${receiptNo}`),
  getDues: (studentId: string) => apiClient.get(`/fees/dues/${studentId}`),
  getFeeStructure: (classId: string) => apiClient.get(`/fees/structure/${classId}`),
  getReceiptPdfUrl: (receiptNo: string) => `${API_BASE_URL}/fees/receipt/pdf?receiptNo=${encodeURIComponent(receiptNo)}`,
  openReceiptPdf: async (receiptNo: string) => {
    try {
      // Create a temporary link to download if window.open fails
      const response = await apiClient.get(`/fees/receipt/pdf`, {
        params: { receiptNo },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Try opening in new tab
      const newWindow = window.open(url, '_blank');

      // If blocked, fallback to same window or download
      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        // Fallback: Create a link and click it to force download/open
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        // link.download = `Receipt-${receiptNo}.pdf`; // Optional: force download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error opening receipt PDF:', error);
      alert('Failed to open receipt. Please check your internet connection or allow popups.');
    }
  },
  getDemandBillPdfUrl: (billNo: string) => `${API_BASE_URL}/fees/demand-bill/pdf?billNo=${encodeURIComponent(billNo)}`,
  openDemandBillPdf: async (billNo: string) => {
    try {
      const response = await apiClient.get(`/fees/demand-bill/pdf`, {
        params: { billNo },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening demand bill PDF:', error);
      alert('Failed to open demand bill. Please try again.');
    }
  },
  openBatchDemandBillPdf: async (billNumbers: string[], metadata?: { period?: string, billType?: string, classInfo?: string }) => {
    try {
      const response = await apiClient.post('/fees/demand-bills/batch-pdf', {
        billNumbers,
        ...metadata,
      }, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening batch demand bill PDF:', error);
      alert('Failed to open batch demand bills. Please try again.');
    }
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
    affiliationNo?: string;
    affiliationNote?: string;
    isoCertifiedNote?: string;
    demandBillNote?: string;
    feeReceiptNote?: string;
    admitCardNote?: string;
    transferCertNote?: string;
    idCardNote?: string;
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
// User Management Service
export const usersService = {
  getAll: async (includeInactive: boolean = false) => {
    const { data } = await apiClient.get('/users', {
      params: { includeInactive: includeInactive ? 'true' : 'false' },
    });
    return data;
  },
  getById: async (id: number) => {
    const { data } = await apiClient.get(`/users/${id}`);
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
    const { data } = await apiClient.post('/users', userData);
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
    const { data } = await apiClient.put(`/users/${id}`, userData);
    return data;
  },
  changePassword: async (id: number, newPassword: string) => {
    const { data } = await apiClient.put(`/users/${id}/password`, { newPassword });
    return data;
  },
  delete: async (id: number) => {
    const { data } = await apiClient.delete(`/users/${id}`);
    return data;
  },
  getTeachers: async () => {
    const { data } = await apiClient.get('/users?role=TEACHER');
    return data.users || [];
  },
};


export const classService = {
  getAll: async () => {
    const { data } = await apiClient.get('/classes');
    return data;
  },
  create: async (classData: any) => {
    const { data } = await apiClient.post('/classes', classData);
    return data;
  },
  update: async (id: number, classData: any) => {
    const { data } = await apiClient.patch(`/classes/${id}`, classData);
    return data;
  },
  reorder: async (items: any[]) => {
    const { data } = await apiClient.post('/classes/reorder', { items });
    return data;
  },
  delete: async (id: number) => {
    const { data } = await apiClient.delete(`/classes/${id}`);
    return data;
  },
  getById: async (id: number) => {
    const { data } = await apiClient.get(`/classes/${id}`);
    return data;
  },
  getSubjects: async (id: number) => {
    const { data } = await apiClient.get(`/classes/${id}/subjects`);
    return data;
  },
  assignSubject: async (id: number, data: { subjectId: number; isCompulsory?: boolean; weeklyPeriods?: number; order?: number }) => {
    const { data: responseData } = await apiClient.post(`/classes/${id}/subjects`, data);
    return responseData;
  },
  removeSubject: async (classId: number, subjectId: number) => {
    const { data } = await apiClient.delete(`/classes/${classId}/subjects/${subjectId}`);
    return data;
  },
};

export const subjectService = {
  getAll: async () => {
    const { data } = await apiClient.get('/subjects');
    return data;
  },
  create: async (subjectData: any) => {
    const { data } = await apiClient.post('/subjects', subjectData);
    return data;
  },
  update: async (id: number, subjectData: any) => {
    const { data } = await apiClient.patch(`/subjects/${id}`, subjectData);
    return data;
  },
  delete: async (id: number) => {
    const { data } = await apiClient.delete(`/subjects/${id}`);
    return data;
  },
};

export const sectionsService = {
  create: async (sectionData: { name: string; classId: number; capacity?: number; roomId?: string }) => {
    const { data } = await apiClient.post('/sections', sectionData);
    return data;
  },
  update: async (id: number, sectionData: any) => {
    const { data } = await apiClient.patch(`/sections/${id}`, sectionData);
    return data;
  },
  delete: async (id: number) => {
    const { data } = await apiClient.delete(`/sections/${id}`);
    return data;
  },
  assignTeacher: async (sectionId: number, teacherId: number, sessionId: number) => {
    const { data } = await apiClient.post(`/sections/${sectionId}/assign-teacher`, { teacherId, sessionId });
    return data;
  },
  assignSubjectTeacher: async (sectionId: number, subjectId: number, teacherId: number, sessionId: number) => {
    const { data } = await apiClient.post(`/sections/${sectionId}/assign-subject-teacher`, { subjectId, teacherId, sessionId });
    return data;
  },
};

export const routineService = {
  getAll: async (params: { classId?: number; sectionId?: number; teacherId?: number }) => {
    const { data } = await apiClient.get('/routines', { params });
    return data;
  },
  getRoutine: async (sectionId?: number, teacherId?: number) => {
    const { data } = await apiClient.get('/routines', {
      params: { sectionId, teacherId }
    });
    return data;
  },
  create: async (routineData: any) => {
    const { data } = await apiClient.post('/routines', routineData);
    return data;
  },
  update: async (id: number, routineData: any) => {
    const { data } = await apiClient.patch(`/routines/${id}`, routineData);
    return data;
  },
  delete: async (id: number) => {
    const { data } = await apiClient.delete(`/routines/${id}`);
    return data;
  },
};

export const studentsService = {
  assignRollNumbers: async (data: { classId: number; sectionId: number; sortBy: 'NAME' | 'ADMISSION_DATE' }) => {
    const response = await apiClient.post('/students/assign-roll-numbers', data);
    return response.data;
  }
};
