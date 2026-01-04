export declare class FeeStructureItemDto {
    feeTypeId: number;
    amount: number;
    isOptional?: boolean;
    frequency?: string;
}
export declare class UpsertFeeStructureDto {
    description?: string;
    items: FeeStructureItemDto[];
}
export declare class CopyFeeStructureDto {
    sourceSessionId: number;
    targetSessionId: number;
    classes?: string[];
    applyPercentageIncrease?: number;
}
