import api from '../lib/api';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: {
    type: 'all' | 'student' | 'parent' | 'teacher' | 'staff';
    classId?: string;
    sectionId?: string;
  };
  publishAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAnnouncementDto {
  title: string;
  body: string;
  audience: {
    type: 'all' | 'student' | 'parent' | 'teacher' | 'staff';
    classId?: string;
    sectionId?: string;
  };
  publishAt?: string;
  expiresAt?: string;
}

export interface QueryAnnouncementDto {
  audienceType?: string;
  classId?: string;
  sectionId?: string;
  active?: boolean;
}

export const announcementsService = {
  /**
   * Get all announcements
   */
  getAll: async (query?: QueryAnnouncementDto): Promise<Announcement[]> => {
    const params = new URLSearchParams();
    if (query?.audienceType) params.append('audienceType', query.audienceType);
    if (query?.classId) params.append('classId', query.classId);
    if (query?.sectionId) params.append('sectionId', query.sectionId);
    if (query?.active !== undefined) params.append('active', query.active.toString());

    const response = await api.get(`/announcements?${params.toString()}`);
    return response.data;
  },

  /**
   * Get my announcements
   */
  getMyAnnouncements: async (): Promise<Announcement[]> => {
    const response = await api.get('/announcements/my');
    return response.data;
  },

  /**
   * Get announcement by ID
   */
  getById: async (id: string): Promise<Announcement> => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  /**
   * Create new announcement
   */
  create: async (data: CreateAnnouncementDto): Promise<Announcement> => {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  /**
   * Update announcement
   */
  update: async (id: string, data: Partial<CreateAnnouncementDto>): Promise<Announcement> => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  /**
   * Delete announcement
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/announcements/${id}`);
  },

  /**
   * Send notification for announcement
   */
  notify: async (id: string): Promise<void> => {
    await api.post(`/announcements/${id}/notify`);
  },
};

export default announcementsService;
