import { IsString, IsOptional, IsBoolean, IsNotEmpty, IsHexColor } from 'class-validator';

export class CreateSubjectDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsHexColor()
    @IsOptional()
    color?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateSubjectDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsHexColor()
    @IsOptional()
    color?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
