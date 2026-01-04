import { DiscountsService } from './discounts.service';
import { CreateDiscountDto, UpdateDiscountDto } from './dto/discount.dto';
export declare class DiscountsController {
    private readonly discountsService;
    constructor(discountsService: DiscountsService);
    findByStudent(studentId: string, sessionId?: string): Promise<{
        discounts: {
            id: number;
            studentId: string;
            feeTypeId: number;
            feeTypeName: string;
            sessionId: number;
            sessionName: string;
            discountType: import("@prisma/client").$Enums.DiscountType;
            discountValue: number;
            reason: string | null;
            approvedBy: string | null;
            createdAt: Date;
        }[];
    }>;
    create(createDiscountDto: CreateDiscountDto): Promise<{
        discountValue: number;
        feeType: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            frequency: string | null;
            isDefault: boolean;
            description: string | null;
            isActive: boolean;
            isRecurring: boolean;
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
        id: number;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        sessionId: number;
        feeTypeId: number;
        discountType: import("@prisma/client").$Enums.DiscountType;
        reason: string | null;
        approvedBy: string | null;
    }>;
    update(id: string, updateDiscountDto: UpdateDiscountDto): Promise<{
        discountValue: number;
        feeType: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            frequency: string | null;
            isDefault: boolean;
            description: string | null;
            isActive: boolean;
            isRecurring: boolean;
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
        id: number;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        sessionId: number;
        feeTypeId: number;
        discountType: import("@prisma/client").$Enums.DiscountType;
        reason: string | null;
        approvedBy: string | null;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
