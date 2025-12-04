import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateFeeTypeDto {
    @IsString()
    @MaxLength(50)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateFeeTypeDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
