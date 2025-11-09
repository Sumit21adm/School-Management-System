export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
}

export interface Student {
  id: string;
  tenantId: string;
  userId: string;
  sectionId?: string;
  admissionNo: string;
  dob?: string;
  gender?: string;
  photo?: string;
  bloodGroup?: string;
  address?: string;
  customFields?: Record<string, any>;
  status: string;
  admissionDate: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  section?: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
      gradeLevel: number;
    };
  };
  guardians?: StudentGuardian[];
}

export interface Guardian {
  id: string;
  tenantId: string;
  userId: string;
  occupation?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  students?: StudentGuardian[];
}

export interface StudentGuardian {
  id: string;
  studentId: string;
  guardianId: string;
  relation: string;
  isPrimary: boolean;
  createdAt: string;
  student?: Student;
  guardian?: Guardian;
}

export interface CreateStudentDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  admissionNo: string;
  dob?: string;
  gender?: string;
  photo?: string;
  bloodGroup?: string;
  address?: string;
  sectionId?: string;
  admissionDate?: string;
  customFields?: Record<string, any>;
}

export interface UpdateStudentDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  photo?: string;
  bloodGroup?: string;
  address?: string;
  sectionId?: string;
  status?: string;
  customFields?: Record<string, any>;
}

export interface CreateGuardianDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  occupation?: string;
  address?: string;
}

export interface UpdateGuardianDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  occupation?: string;
  address?: string;
}

export interface LinkGuardianDto {
  guardianId: string;
  relation: string;
  isPrimary: boolean;
}

export interface ImportStudentRow {
  admissionNo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  sectionName?: string;
  className?: string;
}

export interface ImportStudentsDto {
  students: ImportStudentRow[];
  defaultPassword: string;
}

export interface ImportResult {
  success: Array<{
    admissionNo: string;
    email: string;
    studentId: string;
  }>;
  errors: Array<{
    admissionNo: string;
    email: string;
    error: string;
  }>;
}
