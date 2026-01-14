import { IsString, IsOptional, IsDateString, IsNumber, IsEmail } from 'class-validator';

export class CreateDriverDto {
    @IsString()
    name: string;

    @IsString()
    phone: string;

    @IsOptional()
    @IsString()
    altPhone?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsString()
    licenseNo: string;

    @IsString()
    licenseType: string;

    @IsDateString()
    licenseExpiry: string;

    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;

    @IsOptional()
    @IsDateString()
    dateOfJoining?: string;

    @IsOptional()
    @IsString()
    aadharNo?: string;

    @IsOptional()
    @IsString()
    photoUrl?: string;

    @IsOptional()
    @IsNumber()
    salary?: number;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    emergencyContact?: string;

    @IsOptional()
    @IsString()
    emergencyPhone?: string;
}

export class UpdateDriverDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    altPhone?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    licenseNo?: string;

    @IsOptional()
    @IsString()
    licenseType?: string;

    @IsOptional()
    @IsDateString()
    licenseExpiry?: string;

    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;

    @IsOptional()
    @IsDateString()
    dateOfJoining?: string;

    @IsOptional()
    @IsString()
    aadharNo?: string;

    @IsOptional()
    @IsString()
    photoUrl?: string;

    @IsOptional()
    @IsNumber()
    salary?: number;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    emergencyContact?: string;

    @IsOptional()
    @IsString()
    emergencyPhone?: string;
}
