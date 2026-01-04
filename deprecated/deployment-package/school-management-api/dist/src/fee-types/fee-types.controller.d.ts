import { FeeTypesService } from './fee-types.service';
import { CreateFeeTypeDto, UpdateFeeTypeDto } from './dto/fee-type.dto';
export declare class FeeTypesController {
    private readonly feeTypesService;
    constructor(feeTypesService: FeeTypesService);
    findAll(activeOnly?: string): Promise<{
        feeTypes: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            frequency: string | null;
            isDefault: boolean;
            description: string | null;
            isActive: boolean;
            isRecurring: boolean;
        }[];
    }>;
    findOne(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        frequency: string | null;
        isDefault: boolean;
        description: string | null;
        isActive: boolean;
        isRecurring: boolean;
    }>;
    create(createFeeTypeDto: CreateFeeTypeDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        frequency: string | null;
        isDefault: boolean;
        description: string | null;
        isActive: boolean;
        isRecurring: boolean;
    }>;
    update(id: number, updateFeeTypeDto: UpdateFeeTypeDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        frequency: string | null;
        isDefault: boolean;
        description: string | null;
        isActive: boolean;
        isRecurring: boolean;
    }>;
    delete(id: number): Promise<{
        message: string;
    }>;
}
