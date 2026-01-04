import { PrismaService } from '../prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
export declare class SubjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createSubjectDto: CreateSubjectDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        code: string | null;
        color: string | null;
    }>;
    findAll(): Promise<({
        classSubjects: ({
            class: {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                displayName: string;
                order: number;
                capacity: number | null;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            order: number;
            subjectId: number;
            classId: number;
            isCompulsory: boolean;
            weeklyPeriods: number;
        })[];
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        code: string | null;
        color: string | null;
    })[]>;
    findOne(id: number): Promise<({
        classSubjects: ({
            class: {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                displayName: string;
                order: number;
                capacity: number | null;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            order: number;
            subjectId: number;
            classId: number;
            isCompulsory: boolean;
            weeklyPeriods: number;
        })[];
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        code: string | null;
        color: string | null;
    }) | null>;
    update(id: number, updateSubjectDto: UpdateSubjectDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        code: string | null;
        color: string | null;
    }>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        code: string | null;
        color: string | null;
    }>;
}
