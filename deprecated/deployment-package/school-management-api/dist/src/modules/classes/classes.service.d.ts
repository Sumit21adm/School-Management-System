import { PrismaService } from '../../prisma.service';
export declare class ClassesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        displayName: string;
        order: number;
        capacity: number | null;
    }[]>;
    create(data: {
        name: string;
        displayName: string;
        order?: number;
        capacity?: number;
    }): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        displayName: string;
        order: number;
        capacity: number | null;
    }>;
    update(id: number, data: {
        name?: string;
        displayName?: string;
        capacity?: number;
        isActive?: boolean;
    }): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        displayName: string;
        order: number;
        capacity: number | null;
    }>;
    reorder(items: {
        id: number;
        order: number;
    }[]): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        displayName: string;
        order: number;
        capacity: number | null;
    }[]>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        displayName: string;
        order: number;
        capacity: number | null;
    }>;
}
