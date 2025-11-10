import api from '../lib/api';

export interface Hostel {
  id: string;
  name: string;
  type: 'BOYS' | 'GIRLS' | 'COED';
  address?: string;
  capacity: number;
  wardenName?: string;
  wardenContact?: string;
  rooms?: HostelRoom[];
  createdAt: string;
  updatedAt?: string;
}

export interface HostelRoom {
  id: string;
  hostelId: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  type: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORMITORY';
  fee: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  allocations?: StudentHostelAllocation[];
  createdAt: string;
  updatedAt?: string;
}

export interface StudentHostelAllocation {
  id: string;
  studentId: string;
  roomId: string;
  academicYearId: string;
  checkInDate: string;
  checkOutDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export const hostelService = {
  /**
   * Get all hostels
   */
  getAll: async (): Promise<Hostel[]> => {
    const response = await api.get('/hostel');
    return response.data;
  },

  /**
   * Get hostel by ID
   */
  getById: async (id: string): Promise<Hostel> => {
    const response = await api.get(`/hostel/${id}`);
    return response.data;
  },

  /**
   * Create new hostel
   */
  create: async (data: Partial<Hostel>): Promise<Hostel> => {
    const response = await api.post('/hostel', data);
    return response.data;
  },

  /**
   * Update hostel
   */
  update: async (id: string, data: Partial<Hostel>): Promise<Hostel> => {
    const response = await api.put(`/hostel/${id}`, data);
    return response.data;
  },

  /**
   * Delete hostel
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/hostel/${id}`);
  },

  /**
   * Get rooms for a hostel
   */
  getRooms: async (hostelId: string): Promise<HostelRoom[]> => {
    const response = await api.get(`/hostel/${hostelId}/rooms`);
    return response.data;
  },

  /**
   * Create new room
   */
  createRoom: async (data: Partial<HostelRoom>): Promise<HostelRoom> => {
    const response = await api.post('/hostel/rooms', data);
    return response.data;
  },

  /**
   * Update room
   */
  updateRoom: async (id: string, data: Partial<HostelRoom>): Promise<HostelRoom> => {
    const response = await api.put(`/hostel/rooms/${id}`, data);
    return response.data;
  },

  /**
   * Delete room
   */
  deleteRoom: async (id: string): Promise<void> => {
    await api.delete(`/hostel/rooms/${id}`);
  },

  /**
   * Get all student allocations
   */
  getAllocations: async (): Promise<StudentHostelAllocation[]> => {
    const response = await api.get('/hostel/allocations');
    return response.data;
  },

  /**
   * Allocate student to room
   */
  allocateStudent: async (data: Partial<StudentHostelAllocation>): Promise<StudentHostelAllocation> => {
    const response = await api.post('/hostel/allocations', data);
    return response.data;
  },

  /**
   * Remove student allocation
   */
  removeAllocation: async (id: string): Promise<void> => {
    await api.delete(`/hostel/allocations/${id}`);
  },
};

export default hostelService;
