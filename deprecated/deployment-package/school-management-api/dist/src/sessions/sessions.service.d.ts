import { PrismaService } from '../prisma.service';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';
export declare class SessionsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(includeInactive?: boolean): Promise<{
        sessions: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            startDate: Date;
            endDate: Date;
            isSetupMode: boolean;
        }[];
    }>;
    findActive(): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        startDate: Date;
        endDate: Date;
        isSetupMode: boolean;
    }>;
    findOne(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        startDate: Date;
        endDate: Date;
        isSetupMode: boolean;
    }>;
    create(createSessionDto: CreateSessionDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        startDate: Date;
        endDate: Date;
        isSetupMode: boolean;
    }>;
    update(id: number, updateSessionDto: UpdateSessionDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        startDate: Date;
        endDate: Date;
        isSetupMode: boolean;
    }>;
    activate(id: number): Promise<{
        message: string;
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
    }>;
    delete(id: number): Promise<{
        message: string;
    }>;
}
