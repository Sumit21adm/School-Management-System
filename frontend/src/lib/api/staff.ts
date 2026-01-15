import { apiClient } from '../api';

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    TEACHER = 'TEACHER',
    ACCOUNTANT = 'ACCOUNTANT',
    COORDINATOR = 'COORDINATOR',
    RECEPTIONIST = 'RECEPTIONIST',
    LIBRARIAN = 'LIBRARIAN',
    OFFICE_STAFF = 'OFFICE_STAFF',
    DRIVER = 'DRIVER',
    CONDUCTOR = 'CONDUCTOR',
    SECURITY = 'SECURITY',
    PARENT = 'PARENT',
    STUDENT = 'STUDENT'
}

export interface StaffDetails {
    id: number;
    designation: string;
    department?: string;
    joiningDate: string;
    bloodGroup?: string;
    qualification?: string;
    experience?: string;
    basicSalary?: number;
    bankName?: string;
    accountNo?: string;
    ifscCode?: string;
    panNo?: string;
    aadharNo?: string;
}

export interface TeacherProfile {
    id: number;
    qualification?: string;
    experience?: string;
    specialization?: string;
}

export interface DriverDetails {
    id: number;
    licenseNumber?: string;
    licenseExpiry?: string;
    badgeNumber?: string;
}

export interface Staff {
    id: number;
    username: string;
    name: string;
    email?: string;
    phone?: string;
    role: UserRole;
    active: boolean;
    staffDetails?: StaffDetails;
    teacherProfile?: TeacherProfile;
    driverDetails?: DriverDetails;
    drivenVehicles?: {
        id: number;
        vehicleNo: string;
        status: string;
    }[];
}

export interface PaginatedStaffResponse {
    data: Staff[];
    total: number;
    page: number;
    limit: number;
}

export const staffService = {
    getAll: async (role?: string, department?: string, page: number = 1, limit: number = 50) => {
        const params: any = { page, limit };
        if (role) params.role = role;
        if (department) params.department = department;

        const res = await apiClient.get<PaginatedStaffResponse>('/staff', { params });
        return res.data;
    },

    getById: async (id: number) => {
        const res = await apiClient.get<Staff>(`/staff/${id}`);
        return res.data;
    },

    create: async (data: any) => {
        const res = await apiClient.post<Staff>('/staff', data);
        return res.data;
    },

    update: async (id: number, data: any) => {
        const res = await apiClient.patch<Staff>(`/staff/${id}`, data);
        return res.data;
    },

    delete: async (id: number) => {
        const res = await apiClient.delete(`/staff/${id}`);
        return res.data;
    }
};
