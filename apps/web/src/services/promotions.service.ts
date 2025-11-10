import api from '../lib/api';

export interface Promotion {
  id: string;
  studentId: string;
  fromClassId: string;
  toClassId: string;
  academicYearId: string;
  examId?: string;
  percentage?: number;
  status: 'PROMOTED' | 'DETAINED' | 'PENDING';
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PromotionPreview {
  studentId: string;
  studentName: string;
  rollNumber: string;
  fromClass: string;
  toClass: string;
  percentage: number;
  status: 'PROMOTED' | 'DETAINED';
  remarks?: string;
}

export interface BulkPromotionDto {
  fromClassId: string;
  toClassId: string;
  academicYearId: string;
  examId?: string;
  minPercentage?: number;
  studentIds?: string[];
}

export const promotionsService = {
  /**
   * Get all promotions
   */
  getAll: async (query?: { 
    academicYearId?: string;
    classId?: string;
    studentId?: string;
    status?: string;
  }): Promise<Promotion[]> => {
    const params = new URLSearchParams();
    if (query?.academicYearId) params.append('academicYearId', query.academicYearId);
    if (query?.classId) params.append('classId', query.classId);
    if (query?.studentId) params.append('studentId', query.studentId);
    if (query?.status) params.append('status', query.status);

    const response = await api.get(`/promotions?${params.toString()}`);
    return response.data;
  },

  /**
   * Get promotion by ID
   */
  getById: async (id: string): Promise<Promotion> => {
    const response = await api.get(`/promotions/${id}`);
    return response.data;
  },

  /**
   * Preview bulk promotion
   */
  previewBulkPromotion: async (data: BulkPromotionDto): Promise<PromotionPreview[]> => {
    const response = await api.post('/promotions/preview', data);
    return response.data;
  },

  /**
   * Execute bulk promotion
   */
  bulkPromote: async (data: BulkPromotionDto): Promise<Promotion[]> => {
    const response = await api.post('/promotions/bulk', data);
    return response.data;
  },

  /**
   * Promote single student
   */
  promoteStudent: async (data: {
    studentId: string;
    fromClassId: string;
    toClassId: string;
    academicYearId: string;
    remarks?: string;
  }): Promise<Promotion> => {
    const response = await api.post('/promotions', data);
    return response.data;
  },

  /**
   * Detain student
   */
  detainStudent: async (studentId: string, academicYearId: string, remarks?: string): Promise<Promotion> => {
    const response = await api.post('/promotions/detain', {
      studentId,
      academicYearId,
      remarks,
    });
    return response.data;
  },

  /**
   * Reverse promotion
   */
  reversePromotion: async (id: string): Promise<void> => {
    await api.delete(`/promotions/${id}`);
  },

  /**
   * Get student promotion history
   */
  getStudentHistory: async (studentId: string): Promise<Promotion[]> => {
    const response = await api.get(`/promotions/student/${studentId}`);
    return response.data;
  },
};

export default promotionsService;
