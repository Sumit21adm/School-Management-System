import api from './api';
import type { Guardian, CreateGuardianDto, UpdateGuardianDto } from '../types';

export const guardiansService = {
  async getAll() {
    const response = await api.get<Guardian[]>('/guardians');
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<Guardian>(`/guardians/${id}`);
    return response.data;
  },

  async create(data: CreateGuardianDto) {
    const response = await api.post<Guardian>('/guardians', data);
    return response.data;
  },

  async update(id: string, data: UpdateGuardianDto) {
    const response = await api.put<Guardian>(`/guardians/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/guardians/${id}`);
    return response.data;
  },

  async getStats() {
    const response = await api.get<{ total: number }>('/guardians/stats');
    return response.data;
  },
};
