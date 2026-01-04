import { ClassesService } from './classes.service';
export declare class ClassesController {
    private readonly classesService;
    constructor(classesService: ClassesService);
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
    create(createDto: {
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
    reorder(reorderDto: {
        items: {
            id: number;
            order: number;
        }[];
    }): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        displayName: string;
        order: number;
        capacity: number | null;
    }[]>;
    update(id: number, updateDto: {
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
