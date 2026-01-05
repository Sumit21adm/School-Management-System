export interface ExamType {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
}

export interface Subject {
    id: number;
    name: string;
    code?: string;
    isActive: boolean;
}

export interface Exam {
    id: number;
    name: string;
    examTypeId: number;
    sessionId: number;
    startDate: string;
    endDate: string;
    description?: string;
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
    examType?: ExamType;
    session?: any;
    schedules?: ExamSchedule[];
    _count?: {
        schedules: number;
    }
}

export interface ExamSchedule {
    id: number;
    examId: number;
    subjectId: number;
    className: string;
    date: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    roomNo?: string;
    subject?: Subject;
}
