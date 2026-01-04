export declare class CreateExamTypeDto {
    name: string;
    description?: string;
}
export declare class UpdateExamTypeDto {
    name?: string;
    description?: string;
    isActive?: boolean;
}
export declare class CreateSubjectDto {
    name: string;
    code?: string;
}
export declare class UpdateSubjectDto {
    name?: string;
    code?: string;
    isActive?: boolean;
}
export declare class CreateExamScheduleDto {
    subjectId: number;
    className: string;
    date: string;
    startTime: string;
    endTime: string;
    roomNo?: string;
}
export declare class CreateExamDto {
    name: string;
    examTypeId: number;
    sessionId: number;
    startDate: string;
    endDate: string;
    description?: string;
    schedules?: CreateExamScheduleDto[];
}
export declare class UpdateExamDto {
    name?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    status?: string;
}
