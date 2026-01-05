import { IsString, IsDateString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateSessionDto {
    @IsString()
    @MaxLength(30)
    name: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsOptional()
    @IsBoolean()
    isSetupMode?: boolean;
}

export class UpdateSessionDto {
    @IsOptional()
    @IsString()
    @MaxLength(30)
    name?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsBoolean()
    isSetupMode?: boolean;
}
