import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdatePrintSettingsDto {
    @IsString()
    @MaxLength(200)
    schoolName: string;

    @IsString()
    schoolAddress: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    website?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    tagline?: string;
}
