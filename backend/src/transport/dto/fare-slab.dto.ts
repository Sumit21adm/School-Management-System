import { IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateFareSlabDto {
    @IsNumber()
    minDistance: number;

    @IsNumber()
    maxDistance: number;

    @IsNumber()
    monthlyFee: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateFareSlabDto {
    @IsOptional()
    @IsNumber()
    minDistance?: number;

    @IsOptional()
    @IsNumber()
    maxDistance?: number;

    @IsOptional()
    @IsNumber()
    monthlyFee?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
