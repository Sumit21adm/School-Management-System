import api from './api';
import type { 
  Student, 
  CreateStudentDto, 
  UpdateStudentDto, 
  ImportStudentsDto, 
  ImportResult,
  LinkGuardianDto,
  StudentGuardian
} from '../types';

export const studentsService = {
  async getAll(params?: { sectionId?: string; status?: string }) {
    const response = await api.get<Student[]>('/students', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<Student>(`/students/${id}`);
    return response.data;
  },

  async create(data: CreateStudentDto) {
    const response = await api.post<Student>('/students', data);
    return response.data;
  },

  async update(id: string, data: UpdateStudentDto) {
    const response = await api.put<Student>(`/students/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  async getStats() {
    const response = await api.get<{ total: number; byClass: number }>('/students/stats');
    return response.data;
  },

  async importStudents(data: ImportStudentsDto) {
    const response = await api.post<ImportResult>('/students/import', data);
    return response.data;
  },

  async linkGuardian(studentId: string, data: LinkGuardianDto) {
    const response = await api.post<StudentGuardian>(`/students/${studentId}/guardians`, data);
    return response.data;
  },

  async unlinkGuardian(studentId: string, guardianId: string) {
    const response = await api.delete(`/students/${studentId}/guardians/${guardianId}`);
    return response.data;
  },

  async downloadIdCard(studentId: string) {
    const response = await api.get(`/students/${studentId}/id-card`, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `student-id-${studentId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
