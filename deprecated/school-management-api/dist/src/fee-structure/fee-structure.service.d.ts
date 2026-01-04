import { PrismaService } from '../prisma.service';
import { UpsertFeeStructureDto, CopyFeeStructureDto } from './dto/fee-structure.dto';
export declare class FeeStructureService {
    private prisma;
    constructor(prisma: PrismaService);
    getStructure(sessionId: number, className: string): Promise<{
        sessionId: number;
        sessionName: string;
        className: string;
        items: never[];
        totalAmount: number;
        id?: undefined;
        description?: undefined;
    } | {
        id: number;
        sessionId: number;
        sessionName: string;
        className: string;
        description: string | null;
        items: {
            feeTypeId: number;
            feeTypeName: string;
            amount: number;
            isOptional: boolean;
            frequency: string | null;
        }[];
        totalAmount: number;
    }>;
    upsertStructure(sessionId: number, className: string, dto: UpsertFeeStructureDto): Promise<{
        sessionId: number;
        sessionName: string;
        className: string;
        items: never[];
        totalAmount: number;
        id?: undefined;
        description?: undefined;
    } | {
        id: number;
        sessionId: number;
        sessionName: string;
        className: string;
        description: string | null;
        items: {
            feeTypeId: number;
            feeTypeName: string;
            amount: number;
            isOptional: boolean;
            frequency: string | null;
        }[];
        totalAmount: number;
    }>;
    copyStructure(dto: CopyFeeStructureDto): Promise<{
        message: string;
        copiedCount: number;
        classes: string[];
    }>;
}
