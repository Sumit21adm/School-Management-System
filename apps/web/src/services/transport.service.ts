import api from '../lib/api';

export interface TransportRoute {
  id: string;
  name: string;
  description?: string;
  vehicleId?: string;
  fee: number;
  stops: RouteStop[];
  allocations?: StudentAllocation[];
  createdAt: string;
  updatedAt?: string;
}

export interface RouteStop {
  id: string;
  routeId: string;
  name: string;
  arrivalTime: string;
  departureTime: string;
  sequence: number;
  address?: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: 'BUS' | 'VAN' | 'CAR';
  capacity: number;
  driverName?: string;
  driverContact?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  createdAt: string;
  updatedAt?: string;
}

export interface StudentAllocation {
  id: string;
  studentId: string;
  routeId: string;
  stopId: string;
  academicYearId: string;
  createdAt: string;
  updatedAt?: string;
}

export const transportService = {
  /**
   * Get all routes
   */
  getRoutes: async (): Promise<TransportRoute[]> => {
    const response = await api.get('/transport/routes');
    return response.data;
  },

  /**
   * Get route by ID
   */
  getRouteById: async (id: string): Promise<TransportRoute> => {
    const response = await api.get(`/transport/routes/${id}`);
    return response.data;
  },

  /**
   * Create new route
   */
  createRoute: async (data: Partial<TransportRoute>): Promise<TransportRoute> => {
    const response = await api.post('/transport/routes', data);
    return response.data;
  },

  /**
   * Update route
   */
  updateRoute: async (id: string, data: Partial<TransportRoute>): Promise<TransportRoute> => {
    const response = await api.put(`/transport/routes/${id}`, data);
    return response.data;
  },

  /**
   * Delete route
   */
  deleteRoute: async (id: string): Promise<void> => {
    await api.delete(`/transport/routes/${id}`);
  },

  /**
   * Get all vehicles
   */
  getVehicles: async (): Promise<Vehicle[]> => {
    const response = await api.get('/transport/vehicles');
    return response.data;
  },

  /**
   * Get vehicle by ID
   */
  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await api.get(`/transport/vehicles/${id}`);
    return response.data;
  },

  /**
   * Create new vehicle
   */
  createVehicle: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    const response = await api.post('/transport/vehicles', data);
    return response.data;
  },

  /**
   * Update vehicle
   */
  updateVehicle: async (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
    const response = await api.put(`/transport/vehicles/${id}`, data);
    return response.data;
  },

  /**
   * Delete vehicle
   */
  deleteVehicle: async (id: string): Promise<void> => {
    await api.delete(`/transport/vehicles/${id}`);
  },

  /**
   * Get all student allocations
   */
  getAllocations: async (): Promise<StudentAllocation[]> => {
    const response = await api.get('/transport/allocations');
    return response.data;
  },

  /**
   * Allocate student to route
   */
  allocateStudent: async (data: Partial<StudentAllocation>): Promise<StudentAllocation> => {
    const response = await api.post('/transport/allocations', data);
    return response.data;
  },

  /**
   * Remove student allocation
   */
  removeAllocation: async (id: string): Promise<void> => {
    await api.delete(`/transport/allocations/${id}`);
  },
};

export default transportService;
