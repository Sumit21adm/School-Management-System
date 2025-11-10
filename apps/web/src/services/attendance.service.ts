import api from '../lib/api';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  sectionId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAttendanceDto {
  sectionId: string;
  date: string;
  records: {
    studentId: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    remarks?: string;
  }[];
}

export interface QueryAttendanceDto {
  sectionId?: string;
  studentId?: string;
  classId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
}

export interface AttendanceStats {
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendancePercentage: string;
}

export interface AttendanceReport {
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    rollNumber: string;
  };
  section?: {
    id: string;
    name: string;
    class: {
      name: string;
    };
  };
  fromDate: string;
  toDate: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendancePercentage: string;
  records: AttendanceRecord[];
}

export const attendanceService = {
  /**
   * Get all attendance records
   */
  getAll: async (query?: QueryAttendanceDto): Promise<AttendanceRecord[]> => {
    const params = new URLSearchParams();
    if (query?.sectionId) params.append('sectionId', query.sectionId);
    if (query?.studentId) params.append('studentId', query.studentId);
    if (query?.classId) params.append('classId', query.classId);
    if (query?.fromDate) params.append('fromDate', query.fromDate);
    if (query?.toDate) params.append('toDate', query.toDate);
    if (query?.status) params.append('status', query.status);

    const response = await api.get(`/attendance?${params.toString()}`);
    return response.data;
  },

  /**
   * Get attendance by ID
   */
  getById: async (id: string): Promise<AttendanceRecord> => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },

  /**
   * Create attendance records
   */
  create: async (data: CreateAttendanceDto): Promise<AttendanceRecord[]> => {
    const response = await api.post('/attendance', data);
    return response.data;
  },

  /**
   * Get attendance statistics
   */
  getStats: async (): Promise<AttendanceStats> => {
    const response = await api.get('/attendance/stats');
    return response.data;
  },

  /**
   * Get section attendance report
   */
  getSectionReport: async (
    sectionId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<AttendanceReport> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);

    const response = await api.get(`/attendance/reports/section/${sectionId}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get student attendance report
   */
  getStudentReport: async (
    studentId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<AttendanceReport> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);

    const response = await api.get(`/attendance/reports/student/${studentId}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get class attendance report
   */
  getClassReport: async (
    classId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<AttendanceReport> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);

    const response = await api.get(`/attendance/reports/class/${classId}?${params.toString()}`);
    return response.data;
  },
};

export default attendanceService;
