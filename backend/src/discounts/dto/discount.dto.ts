import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateDiscountDto {
    @IsString()
    studentId: string;

    @IsNumber()
    feeTypeId: number;

    @IsNumber()
    sessionId: number;

    @IsEnum(['PERCENTAGE', 'FIXED'])
    discountType: 'PERCENTAGE' | 'FIXED';

    @IsNumber()
    @Min(0)
    discountValue: number;

    @IsOptional()
    @IsString()
    reason?: string;

    @IsOptional()
    @IsString()
    approvedBy?: string;
}

export class UpdateDiscountDto {
    @IsOptional()
    @IsEnum(['PERCENTAGE', 'FIXED'])
    discountType?: 'PERCENTAGE' | 'FIXED';

    @IsOptional()
    @IsNumber()
    @Min(0)
    discountValue?: number;

    @IsOptional()
    @IsString()
    reason?: string;

    @IsOptional()
    @IsString()
    approvedBy?: string;
}
