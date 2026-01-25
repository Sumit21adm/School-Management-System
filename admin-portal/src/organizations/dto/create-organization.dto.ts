import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateOrganizationDto {
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    name: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    pincode?: string;

    // Admin user details
    @IsOptional()
    @IsEmail()
    adminEmail?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    adminPassword?: string;

    @IsOptional()
    @IsString()
    adminName?: string;
}
