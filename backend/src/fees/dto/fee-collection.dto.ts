import { IsString, IsNumber, IsEnum, IsOptional, IsArray, ValidateNested, Min, IsDateString, IsNotEmpty, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMode {
    CASH = 'cash',
    CHEQUE = 'cheque',
    ONLINE = 'online',
    CARD = 'card',
    UPI = 'upi'
}

export class FeePaymentDetailDto {
    @IsNumber()
    @IsNotEmpty({ message: 'Fee type is required' })
    feeTypeId: number;

    @IsNumber()
    @IsPositive({ message: 'Amount must be a positive number' })
    amount: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    discountAmount?: number;
}

// Split Payment Mode Support - each payment mode has an amount and optional reference
export class PaymentModeDetailDto {
    @IsEnum(PaymentMode)
    paymentMode: PaymentMode;

    @IsNumber()
    @IsPositive({ message: 'Amount must be a positive number' })
    amount: number;

    @IsString()
    @IsOptional()
    reference?: string;  // Check no, UPI ref, card last 4 digits
}

export class CollectFeeDto {
    @IsString()
    @IsNotEmpty({ message: 'Student ID is required' })
    studentId: string;

    @IsNumber()
    @IsNotEmpty({ message: 'Session is required' })
    sessionId: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FeePaymentDetailDto)
    feeDetails: FeePaymentDetailDto[];

    // Single paymentMode removed in Refactoring Phase 3


    // NEW: Array of payment modes for split payments
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PaymentModeDetailDto)
    @IsOptional()
    paymentModes?: PaymentModeDetailDto[];

    @IsString()
    @IsOptional()
    receiptNo?: string;

    @IsString()
    @IsOptional()
    remarks?: string;

    @IsString()
    @IsOptional()
    collectedBy?: string;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    @IsOptional()
    billNo?: string;  // Bill number this payment is against
}

export class FeeStatementDto {
    @IsString()
    studentId: string;

    @IsNumber()
    sessionId: number;

    @IsDateString()
    @IsOptional()
    fromDate?: string;

    @IsDateString()
    @IsOptional()
    toDate?: string;
}
