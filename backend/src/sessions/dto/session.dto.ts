import { IsString, IsDateString, IsBoolean, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateSessionDto {
    @IsString()
    @MaxLength(30)
    @IsNotEmpty({ message: 'Session name is required' })
    name: string;

    @IsDateString()
    @IsNotEmpty({ message: 'Start date is required' })
    startDate: string;

    @IsDateString()
    @IsNotEmpty({ message: 'End date is required' })
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
