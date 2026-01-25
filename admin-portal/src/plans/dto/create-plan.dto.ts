import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, Min } from 'class-validator';

export class CreatePlanDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    @Min(0)
    pricePerStudent: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    minStudents?: number;

    @IsOptional()
    @IsNumber()
    maxStudents?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    baseFeeMonthly?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    baseFeeYearly?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    yearlyDiscount?: number;

    @IsArray()
    includedModules: string[];

    @IsOptional()
    @IsNumber()
    maxUsers?: number;

    @IsOptional()
    @IsBoolean()
    isPopular?: boolean;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;
}
