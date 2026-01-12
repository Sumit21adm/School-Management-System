import { IsString, IsNumber, IsEnum, IsOptional, IsArray, ValidateNested, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMode {
    CASH = 'cash',
    CHEQUE = 'cheque',
    ONLINE = 'online',
    CARD = 'card',
    UPI = 'upi',
    ADVANCE = 'advance'
}

export class FeePaymentDetailDto {
    @IsNumber()
    feeTypeId: number;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    discountAmount?: number;
}

export class CollectFeeDto {
    @IsString()
    studentId: string;

    @IsNumber()
    sessionId: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FeePaymentDetailDto)
    feeDetails: FeePaymentDetailDto[];

    @IsEnum(PaymentMode)
    paymentMode: PaymentMode;

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
