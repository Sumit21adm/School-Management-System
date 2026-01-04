import { PrismaService } from '../../prisma.service';
import { CreateExamDto, UpdateExamDto, CreateExamScheduleDto } from '../dto/examination.dto';
export declare class ExamsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(sessionId?: number, status?: string): Promise<({
        examType: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
        };
        session: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            startDate: Date;
            endDate: Date;
            isSetupMode: boolean;
        };
        _count: {
            schedules: number;
        };
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        startDate: Date;
        endDate: Date;
        status: string;
        sessionId: number;
        examTypeId: number;
    })[]>;
    findOne(id: number): Promise<{
        examType: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
        };
        schedules: ({
            subject: {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                isActive: boolean;
                code: string | null;
                color: string | null;
            };
        } & {
            id: number;
            className: string;
            date: Date;
            subjectId: number;
            startTime: Date;
            endTime: Date;
            roomNo: string | null;
            examId: number;
        })[];
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        startDate: Date;
        endDate: Date;
        status: string;
        sessionId: number;
        examTypeId: number;
    }>;
    create(dto: CreateExamDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        startDate: Date;
        endDate: Date;
        status: string;
        sessionId: number;
        examTypeId: number;
    }>;
    update(id: number, dto: UpdateExamDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        startDate: Date;
        endDate: Date;
        status: string;
        sessionId: number;
        examTypeId: number;
    }>;
    delete(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        startDate: Date;
        endDate: Date;
        status: string;
        sessionId: number;
        examTypeId: number;
    }>;
    addSchedule(examId: number, dto: CreateExamScheduleDto): Promise<{
        id: number;
        className: string;
        date: Date;
        subjectId: number;
        startTime: Date;
        endTime: Date;
        roomNo: string | null;
        examId: number;
    }>;
    deleteSchedule(scheduleId: number): Promise<{
        id: number;
        className: string;
        date: Date;
        subjectId: number;
        startTime: Date;
        endTime: Date;
        roomNo: string | null;
        examId: number;
    }>;
}
