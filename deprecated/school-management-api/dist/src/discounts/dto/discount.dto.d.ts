export declare class CreateDiscountDto {
    studentId: string;
    feeTypeId: number;
    sessionId: number;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    reason?: string;
    approvedBy?: string;
}
export declare class UpdateDiscountDto {
    discountType?: 'PERCENTAGE' | 'FIXED';
    discountValue?: number;
    reason?: string;
    approvedBy?: string;
}
