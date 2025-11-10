import api from '../lib/api';

export interface ReportFilters {
  type: 'students' | 'attendance' | 'fees' | 'exams' | 'staff' | 'transport' | 'library';
  format: 'csv' | 'pdf' | 'excel';
  classId?: string;
  sectionId?: string;
  academicYearId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
}

export interface ReportMetadata {
  name: string;
  description: string;
  generatedAt: string;
  filters: any;
  recordCount: number;
}

export const reportsService = {
  /**
   * Generate report
   */
  generate: async (filters: ReportFilters): Promise<Blob> => {
    const response = await api.post('/reports/generate', filters, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get available reports
   */
  getAvailable: async (): Promise<{ type: string; name: string; description: string }[]> => {
    const response = await api.get('/reports/available');
    return response.data;
  },

  /**
   * Generate students report
   */
  generateStudentsReport: async (filters: {
    classId?: string;
    sectionId?: string;
    status?: string;
    format: 'csv' | 'pdf' | 'excel';
  }): Promise<Blob> => {
    const response = await api.post('/reports/students', filters, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Generate attendance report
   */
  generateAttendanceReport: async (filters: {
    classId?: string;
    sectionId?: string;
    fromDate: string;
    toDate: string;
    format: 'csv' | 'pdf' | 'excel';
  }): Promise<Blob> => {
    const response = await api.post('/reports/attendance', filters, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Generate fees report
   */
  generateFeesReport: async (filters: {
    classId?: string;
    status?: 'PAID' | 'PENDING' | 'OVERDUE';
    fromDate?: string;
    toDate?: string;
    format: 'csv' | 'pdf' | 'excel';
  }): Promise<Blob> => {
    const response = await api.post('/reports/fees', filters, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Generate exams report
   */
  generateExamsReport: async (filters: {
    examId: string;
    classId?: string;
    format: 'csv' | 'pdf' | 'excel';
  }): Promise<Blob> => {
    const response = await api.post('/reports/exams', filters, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Download report
   */
  downloadReport: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default reportsService;
