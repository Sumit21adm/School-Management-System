import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateSubjectDto {
    @IsString()
    @MaxLength(50)
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    code?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    @MaxLength(7)
    color?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
