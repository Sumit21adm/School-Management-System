import { apiClient } from '../api';

// Types
export interface Vehicle {
    id: number;
    vehicleNo: string;
    vehicleType: string;
    capacity: number;
    make?: string;
    model?: string;
    driver?: Driver;
    status: string;
}

export interface Driver {
    id: number;
    name: string;
    phone: string;
    licenseNo: string;
    licenseExpiry: string;
    status: string;
    vehicles?: { id: number; vehicleNo: string }[];
}

export interface RouteStop {
    id: number;
    stopName: string;
    stopOrder: number;
    pickupTime?: string;
    dropTime?: string;
    distanceFromSchool?: number;
}

export interface Route {
    id: number;
    routeName: string;
    routeCode: string;
    startPoint: string;
    endPoint: string;
    monthlyFee: number;
    status: string;
    vehicle?: Vehicle;
    stops: RouteStop[];
    studentCount?: number;
}

export interface StudentTransport {
    id: number;
    student: {
        studentId: string;
        name: string;
        className: string;
        section: string;
    };
    route: Route; // Reuse Route interface which has relation fields optionally
    pickupStop?: RouteStop;
    dropStop?: RouteStop;
    transportType: string;
    status: string;
}

// Service
export const transportService = {
    // Vehicles
    getVehicles: (status?: string) =>
        apiClient.get<Vehicle[]>('/transport/vehicles', { params: { status } }).then(res => res.data),

    createVehicle: (data: any) =>
        apiClient.post<Vehicle>('/transport/vehicles', data).then(res => res.data),

    updateVehicle: (id: number, data: any) =>
        apiClient.patch<Vehicle>(`/transport/vehicles/${id}`, data).then(res => res.data),

    deleteVehicle: (id: number) =>
        apiClient.delete(`/transport/vehicles/${id}`).then(res => res.data),

    // Drivers
    getDrivers: (status?: string) =>
        apiClient.get<Driver[]>('/transport/drivers', { params: { status } }).then(res => res.data),

    createDriver: (data: any) =>
        apiClient.post<Driver>('/transport/drivers', data).then(res => res.data),

    updateDriver: (id: number, data: any) =>
        apiClient.patch<Driver>(`/transport/drivers/${id}`, data).then(res => res.data),

    deleteDriver: (id: number) =>
        apiClient.delete(`/transport/drivers/${id}`).then(res => res.data),

    // Routes
    getRoutes: (status?: string) =>
        apiClient.get<Route[]>('/transport/routes', { params: { status } }).then(res => res.data),

    getRoute: (id: number) =>
        apiClient.get<Route>(`/transport/routes/${id}`).then(res => res.data),

    createRoute: (data: any) =>
        apiClient.post<Route>('/transport/routes', data).then(res => res.data),

    updateRoute: (id: number, data: any) =>
        apiClient.patch<Route>(`/transport/routes/${id}`, data).then(res => res.data),

    deleteRoute: (id: number) =>
        apiClient.delete(`/transport/routes/${id}`).then(res => res.data),

    // Stops
    addStop: (routeId: number, data: any) =>
        apiClient.post(`/transport/routes/${routeId}/stops`, data).then(res => res.data),

    updateStop: (routeId: number, stopId: number, data: any) =>
        apiClient.patch(`/transport/routes/${routeId}/stops/${stopId}`, data).then(res => res.data),

    deleteStop: (routeId: number, stopId: number) =>
        apiClient.delete(`/transport/routes/${routeId}/stops/${stopId}`).then(res => res.data),

    // Assignments
    getAssignments: (params?: { routeId?: number; status?: string }) =>
        apiClient.get<StudentTransport[]>('/transport/assignments', { params }).then(res => res.data),

    getStudentAssignment: (studentId: string) =>
        apiClient.get<StudentTransport>(`/transport/assignments/student/${studentId}`).then(res => res.data),

    assignTransport: (data: any) => apiClient.post<StudentTransport>('/transport/assignments', data).then(res => res.data),

    updateAssignment: (id: number, data: any) =>
        apiClient.patch<StudentTransport>(`/transport/assignments/${id}`, data).then(res => res.data),

    bulkAssign: (data: any) =>
        apiClient.post('/transport/assignments/bulk', data).then(res => res.data),

    removeAssignment: (id: number) =>
        apiClient.delete(`/transport/assignments/${id}`).then(res => res.data),

    // Reports
    getRouteWiseReport: () =>
        apiClient.get('/transport/reports/route-wise').then(res => res.data),

    getStopWiseReport: (routeId: number) =>
        apiClient.get(`/transport/reports/stop-wise/${routeId}`).then(res => res.data),

    // Fare Slabs
    getFareSlabs: (activeOnly?: boolean) =>
        apiClient.get('/transport/fare-slabs', { params: { activeOnly } }).then(res => res.data),

    createFareSlab: (data: { minDistance: number; maxDistance: number; monthlyFee: number; description?: string }) =>
        apiClient.post('/transport/fare-slabs', data).then(res => res.data),

    updateFareSlab: (id: number, data: Partial<{ minDistance: number; maxDistance: number; monthlyFee: number; description?: string; isActive: boolean }>) =>
        apiClient.patch(`/transport/fare-slabs/${id}`, data).then(res => res.data),

    deleteFareSlab: (id: number) =>
        apiClient.delete(`/transport/fare-slabs/${id}`).then(res => res.data),
};

export interface FareSlab {
    id: number;
    minDistance: number;
    maxDistance: number;
    monthlyFee: number;
    description?: string;
    isActive: boolean;
}
