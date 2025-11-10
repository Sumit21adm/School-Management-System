import api from '../lib/api/client';

export interface FeeHead {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeePlan {
  id: string;
  tenantId: string;
  classId: string;
  academicYearId: string;
  name: string;
  items: FeePlanItem[];
  class?: any;
  academicYear?: any;
  createdAt: string;
  updatedAt: string;
}

export interface FeePlanItem {
  id: string;
  planId: string;
  feeHeadId: string;
  amount: string;
  dueDate: string;
  feeHead?: FeeHead;
}

export interface Invoice {
  id: string;
  tenantId: string;
  studentId: string;
  total: string;
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  student?: any;
  items?: InvoiceItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  feeHeadId: string;
  amount: string;
  feeHead?: FeeHead;
}

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  method: 'cash' | 'card' | 'online' | 'bank_transfer';
  txnRef?: string;
  amount: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  postedAt: string;
  createdAt: string;
}

// Fee Heads API
export const feeHeadsApi = {
  getAll: () => api.get<FeeHead[]>('/fee-heads'),
  getOne: (id: string) => api.get<FeeHead>(`/fee-heads/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post<FeeHead>('/fee-heads', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch<FeeHead>(`/fee-heads/${id}`, data),
  delete: (id: string) => api.delete(`/fee-heads/${id}`),
};

// Fee Plans API
export const feePlansApi = {
  getAll: (filters?: { classId?: string; academicYearId?: string }) =>
    api.get<FeePlan[]>('/fee-plans', { params: filters }),
  getOne: (id: string) => api.get<FeePlan>(`/fee-plans/${id}`),
  create: (data: {
    name: string;
    classId: string;
    academicYearId: string;
    items: { feeHeadId: string; amount: string; dueDate: string }[];
  }) => api.post<FeePlan>('/fee-plans', data),
  update: (
    id: string,
    data: {
      name?: string;
      items?: { feeHeadId: string; amount: string; dueDate: string }[];
    }
  ) => api.patch<FeePlan>(`/fee-plans/${id}`, data),
  delete: (id: string) => api.delete(`/fee-plans/${id}`),
};

// Invoices API
export const invoicesApi = {
  getAll: (filters?: { studentId?: string; status?: string }) =>
    api.get<Invoice[]>('/invoices', { params: filters }),
  getOne: (id: string) => api.get<Invoice>(`/invoices/${id}`),
  create: (data: {
    studentId: string;
    dueDate: string;
    items: { feeHeadId: string; amount: string }[];
  }) => api.post<Invoice>('/invoices', data),
  bulkGenerate: (data: {
    feePlanId: string;
    studentIds?: string[];
    classId?: string;
    sectionId?: string;
  }) =>
    api.post<{ success: boolean; count: number; invoices: Invoice[] }>(
      '/invoices/bulk-generate',
      data
    ),
  updateStatus: (id: string, status: string) =>
    api.patch<Invoice>(`/invoices/${id}/status`, { status }),
  getStats: () =>
    api.get<{
      total: number;
      pending: number;
      paid: number;
      overdue: number;
      totalAmount: string;
      paidAmount: string;
    }>('/invoices/stats'),
};

// Payments API
export const paymentsApi = {
  getAll: (filters?: { invoiceId?: string; status?: string }) =>
    api.get<Payment[]>('/payments', { params: filters }),
  getOne: (id: string) => api.get<Payment>(`/payments/${id}`),
  create: (data: {
    invoiceId: string;
    amount: string;
    method: string;
    txnRef?: string;
  }) => api.post<Payment>('/payments', data),
  initiatePayment: (invoiceId: string) =>
    api.post<{
      paymentId: string;
      txnRef: string;
      amount: string;
      checkoutUrl: string;
      invoice: any;
    }>(`/payments/initiate/${invoiceId}`),
  getStats: () =>
    api.get<{
      total: number;
      success: number;
      pending: number;
      failed: number;
      totalAmount: string;
    }>('/payments/stats'),
};
