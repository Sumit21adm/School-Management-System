export declare enum PaymentMode {
    CASH = "cash",
    CHEQUE = "cheque",
    ONLINE = "online",
    CARD = "card",
    UPI = "upi"
}
export declare class FeePaymentDetailDto {
    feeTypeId: number;
    amount: number;
    discountAmount?: number;
}
export declare class CollectFeeDto {
    studentId: string;
    sessionId: number;
    feeDetails: FeePaymentDetailDto[];
    paymentMode: PaymentMode;
    receiptNo?: string;
    remarks?: string;
    collectedBy?: string;
    date?: string;
    billNo?: string;
}
export declare class FeeStatementDto {
    studentId: string;
    sessionId: number;
    fromDate?: string;
    toDate?: string;
}
