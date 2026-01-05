import { IsString, IsArray, IsNumber, IsBoolean, IsOptional, ValidateNested, ArrayMinSize, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FeeStructureItemDto {
    @IsNumber()
    feeTypeId: number;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsOptional()
    @IsBoolean()
    isOptional?: boolean;

    @IsOptional()
    @IsString()
    frequency?: string;
}

export class UpsertFeeStructureDto {
    @IsOptional()
    @IsString()
    description?: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => FeeStructureItemDto)
    items: FeeStructureItemDto[];
}

export class CopyFeeStructureDto {
    @IsNumber()
    sourceSessionId: number;

    @IsNumber()
    targetSessionId: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    classes?: string[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    applyPercentageIncrease?: number;
}
