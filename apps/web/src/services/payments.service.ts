import api from '../lib/api';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE' | 'CHEQUE' | 'BANK_TRANSFER';
  transactionId?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePaymentDto {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE' | 'CHEQUE' | 'BANK_TRANSFER';
  transactionId?: string;
  remarks?: string;
}

export interface PaymentSummary {
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
  paymentsByMethod: {
    method: string;
    total: number;
    count: number;
  }[];
}

export const paymentsService = {
  /**
   * Get all payments
   */
  getAll: async (query?: { 
    studentId?: string; 
    invoiceId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<Payment[]> => {
    const params = new URLSearchParams();
    if (query?.studentId) params.append('studentId', query.studentId);
    if (query?.invoiceId) params.append('invoiceId', query.invoiceId);
    if (query?.status) params.append('status', query.status);
    if (query?.fromDate) params.append('fromDate', query.fromDate);
    if (query?.toDate) params.append('toDate', query.toDate);

    const response = await api.get(`/payments?${params.toString()}`);
    return response.data;
  },

  /**
   * Get payment by ID
   */
  getById: async (id: string): Promise<Payment> => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  /**
   * Create new payment
   */
  create: async (data: CreatePaymentDto): Promise<Payment> => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  /**
   * Update payment
   */
  update: async (id: string, data: Partial<CreatePaymentDto>): Promise<Payment> => {
    const response = await api.put(`/payments/${id}`, data);
    return response.data;
  },

  /**
   * Delete payment
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/payments/${id}`);
  },

  /**
   * Get payment summary
   */
  getSummary: async (query?: { 
    fromDate?: string;
    toDate?: string;
  }): Promise<PaymentSummary> => {
    const params = new URLSearchParams();
    if (query?.fromDate) params.append('fromDate', query.fromDate);
    if (query?.toDate) params.append('toDate', query.toDate);

    const response = await api.get(`/payments/summary?${params.toString()}`);
    return response.data;
  },

  /**
   * Get student payments
   */
  getStudentPayments: async (studentId: string): Promise<Payment[]> => {
    const response = await api.get(`/payments/student/${studentId}`);
    return response.data;
  },

  /**
   * Refund payment
   */
  refund: async (id: string, reason?: string): Promise<Payment> => {
    const response = await api.post(`/payments/${id}/refund`, { reason });
    return response.data;
  },
};

export default paymentsService;
