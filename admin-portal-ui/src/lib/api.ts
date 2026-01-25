import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/admin/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    getProfile: () => api.get('/auth/profile'),
};

// Organizations API
export const organizationsApi = {
    getAll: (params?: { skip?: number; take?: number; status?: string; search?: string }) =>
        api.get('/organizations', { params }),
    getOne: (id: number) => api.get(`/organizations/${id}`),
    create: (data: any) => api.post('/organizations', data),
    update: (id: number, data: any) => api.put(`/organizations/${id}`, data),
    updateStatus: (id: number, status: string) =>
        api.patch(`/organizations/${id}/status`, { status }),
    getStats: () => api.get('/organizations/stats'),
};

// Plans API
export const plansApi = {
    getAll: (includeInactive?: boolean) =>
        api.get('/plans', { params: { includeInactive } }),
    getOne: (id: number) => api.get(`/plans/${id}`),
    create: (data: any) => api.post('/plans', data),
    update: (id: number, data: any) => api.put(`/plans/${id}`, data),
    toggle: (id: number) => api.patch(`/plans/${id}/toggle`),
};

// Subscriptions API
export const subscriptionsApi = {
    getAll: (params?: { skip?: number; take?: number; status?: string }) =>
        api.get('/subscriptions', { params }),
    getOne: (id: number) => api.get(`/subscriptions/${id}`),
    create: (data: any) => api.post('/subscriptions', data),
    changePlan: (id: number, planId: number) =>
        api.patch(`/subscriptions/${id}/change-plan`, { planId }),
    cancel: (id: number, reason?: string) =>
        api.patch(`/subscriptions/${id}/cancel`, { reason }),
    activate: (id: number) => api.patch(`/subscriptions/${id}/activate`),
    getExpiringTrials: (days?: number) =>
        api.get('/subscriptions/expiring-trials', { params: { days } }),
};

// Invoices API
export const invoicesApi = {
    getAll: (params?: { skip?: number; take?: number; status?: string; organizationId?: number }) =>
        api.get('/invoices', { params }),
    getOne: (id: number) => api.get(`/invoices/${id}`),
    generate: (subscriptionId: number) =>
        api.post(`/invoices/generate/${subscriptionId}`),
    getOverdue: () => api.get('/invoices/overdue'),
    getRevenueStats: () => api.get('/invoices/revenue-stats'),
};

// Analytics API
export const analyticsApi = {
    getDashboard: () => api.get('/analytics/dashboard'),
    getRevenueTrend: (months?: number) =>
        api.get('/analytics/revenue-trend', { params: { months } }),
    getOrgStats: () => api.get('/analytics/organizations'),
    getSubscriptionStats: () => api.get('/analytics/subscriptions'),
};

// Activation API
export const activationApi = {
    getAll: (params?: { organizationId?: number; status?: string; skip?: number; take?: number }) =>
        api.get('/activation', { params }),
    getOne: (id: number) => api.get(`/activation/${id}`),
    generate: (data: { organizationId: number; maxStudents?: number; maxUsers?: number; notes?: string }) =>
        api.post('/activation/generate', data),
    revoke: (id: number, reason?: string) =>
        api.patch(`/activation/${id}/revoke`, { reason }),
    getOrgStats: (organizationId: number) =>
        api.get(`/activation/org/${organizationId}/stats`),
};

export default api;

