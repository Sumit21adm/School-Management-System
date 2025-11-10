import api from '../lib/api';

export interface Class {
  id: string;
  name: string;
  grade: number;
  academicYearId: string;
  createdAt: string;
  updatedAt?: string;
  sections?: Section[];
}

export interface Section {
  id: string;
  name: string;
  classId: string;
  capacity?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  isOptional: boolean;
  subject?: Subject;
}

export const classesService = {
  /**
   * Get all classes
   */
  getAll: async (): Promise<Class[]> => {
    const response = await api.get('/classes');
    return response.data;
  },

  /**
   * Get class by ID
   */
  getById: async (id: string): Promise<Class> => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  /**
   * Get all subjects
   */
  getSubjects: async (): Promise<Subject[]> => {
    const response = await api.get('/classes/subjects');
    return response.data;
  },

  /**
   * Get subjects for a specific class
   */
  getClassSubjects: async (classId: string): Promise<ClassSubject[]> => {
    const response = await api.get(`/classes/${classId}/subjects`);
    return response.data;
  },

  /**
   * Get sections for a specific class
   */
  getSections: async (classId: string): Promise<Section[]> => {
    const response = await api.get(`/classes/${classId}/sections`);
    return response.data;
  },
};

export default classesService;
