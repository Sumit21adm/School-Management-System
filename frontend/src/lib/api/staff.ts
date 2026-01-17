import { apiClient } from '../api';

export enum UserRole {
    // Administrative
    SUPER_ADMIN = 'SUPER_ADMIN',
    PRINCIPAL = 'PRINCIPAL',
    VICE_PRINCIPAL = 'VICE_PRINCIPAL',
    ADMIN = 'ADMIN',
    // Academic
    HEAD_OF_DEPARTMENT = 'HEAD_OF_DEPARTMENT',
    COORDINATOR = 'COORDINATOR',
    SECTION_INCHARGE = 'SECTION_INCHARGE',
    TEACHER = 'TEACHER',
    // Finance & Office
    ACCOUNTANT = 'ACCOUNTANT',
    RECEPTIONIST = 'RECEPTIONIST',
    LIBRARIAN = 'LIBRARIAN',
    LAB_ASSISTANT = 'LAB_ASSISTANT',
    OFFICE_STAFF = 'OFFICE_STAFF',
    CLERK = 'CLERK',
    // Transport & Support
    DRIVER = 'DRIVER',
    CONDUCTOR = 'CONDUCTOR',
    SECURITY = 'SECURITY',
    PEON = 'PEON',
    // External Users
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
    permissions?: string[]; // Custom permissions override
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
