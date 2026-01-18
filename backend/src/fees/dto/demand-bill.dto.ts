import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsDateString, Min, Max, IsBoolean } from 'class-validator';

export enum BillStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    PARTIALLY_PAID = 'PARTIALLY_PAID',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
    CANCELLED = 'CANCELLED'
}

export class GenerateDemandBillDto {
    @IsString()
    @IsOptional()
    studentId?: string;

    @IsString()
    @IsOptional()
    className?: string;

    @IsString()
    @IsOptional()
    section?: string;

    @IsNumber()
    sessionId: number;

    @IsNumber()
    @Min(1)
    @Max(12)
    @IsOptional()
    month?: number;

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    months?: number[];

    @IsNumber()
    year: number;

    @IsDateString()
    @IsOptional()
    dueDate?: string;

    @IsOptional()
    @IsArray()
    studentIds?: string[];

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    selectedFeeTypeIds?: number[];

    @IsOptional()
    @IsBoolean()
    autoCalculateLateFees?: boolean;
}

export class UpdateBillStatusDto {
    @IsEnum(BillStatus)
    status: BillStatus;

    @IsDateString()
    @IsOptional()
    sentDate?: string;

    @IsDateString()
    @IsOptional()
    paidDate?: string;
}
