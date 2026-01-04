export declare enum BillStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    PAID = "PAID",
    OVERDUE = "OVERDUE",
    CANCELLED = "CANCELLED"
}
export declare class GenerateDemandBillDto {
    studentId?: string;
    className?: string;
    section?: string;
    sessionId: number;
    month: number;
    year: number;
    dueDate?: string;
    studentIds?: string[];
    selectedFeeTypeIds?: number[];
    autoCalculateLateFees?: boolean;
}
export declare class UpdateBillStatusDto {
    status: BillStatus;
    sentDate?: string;
    paidDate?: string;
}
