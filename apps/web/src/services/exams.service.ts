import api from '../lib/api';

export interface Exam {
  id: string;
  name: string;
  type: 'MIDTERM' | 'FINAL' | 'UNIT_TEST' | 'PRACTICAL' | 'OTHER';
  academicYearId: string;
  startDate: string;
  endDate: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExamSchedule {
  id: string;
  examId: string;
  subjectId: string;
  classId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passingMarks: number;
  room?: string;
}

export interface Mark {
  id: string;
  examScheduleId: string;
  studentId: string;
  marksObtained: number;
  remarks?: string;
  isAbsent: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateExamDto {
  name: string;
  type: 'MIDTERM' | 'FINAL' | 'UNIT_TEST' | 'PRACTICAL' | 'OTHER';
  academicYearId: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface CreateExamScheduleDto {
  examId: string;
  subjectId: string;
  classId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passingMarks: number;
  room?: string;
}

export interface CreateMarkDto {
  examScheduleId: string;
  studentId: string;
  marksObtained: number;
  remarks?: string;
  isAbsent?: boolean;
}

export interface BulkMarksDto {
  examScheduleId: string;
  marks: {
    studentId: string;
    marksObtained: number;
    remarks?: string;
    isAbsent?: boolean;
  }[];
}

export const examsService = {
  /**
   * Get all exams
   */
  getAll: async (academicYearId?: string): Promise<Exam[]> => {
    const params = academicYearId ? `?academicYearId=${academicYearId}` : '';
    const response = await api.get(`/exams${params}`);
    return response.data;
  },

  /**
   * Get exam by ID
   */
  getById: async (id: string): Promise<Exam> => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
  },

  /**
   * Create new exam
   */
  create: async (data: CreateExamDto): Promise<Exam> => {
    const response = await api.post('/exams', data);
    return response.data;
  },

  /**
   * Update exam
   */
  update: async (id: string, data: Partial<CreateExamDto>): Promise<Exam> => {
    const response = await api.put(`/exams/${id}`, data);
    return response.data;
  },

  /**
   * Delete exam
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/exams/${id}`);
  },

  /**
   * Get exam schedules
   */
  getSchedules: async (examId: string): Promise<ExamSchedule[]> => {
    const response = await api.get(`/exams/${examId}/schedules`);
    return response.data;
  },

  /**
   * Create exam schedule
   */
  createSchedule: async (data: CreateExamScheduleDto): Promise<ExamSchedule> => {
    const response = await api.post('/exams/schedules', data);
    return response.data;
  },

  /**
   * Get marks for exam schedule
   */
  getMarks: async (examScheduleId: string): Promise<Mark[]> => {
    const response = await api.get(`/exams/schedules/${examScheduleId}/marks`);
    return response.data;
  },

  /**
   * Create single mark entry
   */
  createMark: async (data: CreateMarkDto): Promise<Mark> => {
    const response = await api.post('/exams/marks', data);
    return response.data;
  },

  /**
   * Bulk create marks
   */
  bulkCreateMarks: async (data: BulkMarksDto): Promise<Mark[]> => {
    const response = await api.post('/exams/marks/bulk', data);
    return response.data;
  },

  /**
   * Update mark
   */
  updateMark: async (id: string, data: Partial<CreateMarkDto>): Promise<Mark> => {
    const response = await api.put(`/exams/marks/${id}`, data);
    return response.data;
  },

  /**
   * Get student marks
   */
  getStudentMarks: async (studentId: string, examId?: string): Promise<Mark[]> => {
    const params = examId ? `?examId=${examId}` : '';
    const response = await api.get(`/exams/students/${studentId}/marks${params}`);
    return response.data;
  },
};

export default examsService;
