import { IsString, IsEmail, IsOptional, IsEnum, IsDate, IsNumber, IsBoolean, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class CreateStaffDto {
    // User Base Info
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name: string;

    @IsEnum(UserRole)
    role: UserRole;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    username?: string; // If omitted, can generate automatically

    @IsString()
    @IsOptional()
    password?: string; // If omitted, use default

    @IsBoolean()
    @IsOptional()
    active?: boolean;

    @IsOptional()
    permissions?: string[]; // Array of permission keys

    // Staff Details (HR)
    @IsString()
    @IsNotEmpty({ message: 'Designation is required' })
    designation: string;

    @IsString()
    @IsOptional()
    department?: string;

    @Type(() => Date)
    @IsDate()
    joiningDate: Date;

    @IsString()
    @IsOptional()
    qualification?: string; // Can map to TeacherProfile too

    @IsString()
    @IsOptional()
    experience?: string; // Can map to TeacherProfile too

    @IsString()
    @IsOptional()
    bloodGroup?: string;

    // Financials
    @IsNumber()
    @IsOptional()
    basicSalary?: number;

    @IsString()
    @IsOptional()
    bankName?: string;

    @IsString()
    @IsOptional()
    accountNo?: string;

    @IsString()
    @IsOptional()
    ifscCode?: string;

    @IsString()
    @IsOptional()
    panNo?: string;

    @IsString()
    @IsOptional()
    aadharNo?: string;

    // Teacher Specific (only used if role is TEACHER or similar)
    @IsString()
    @IsOptional()
    specialization?: string;

    // Driver Specific
    @IsString()
    @IsOptional()
    licenseNumber?: string;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    licenseExpiry?: Date;

    @IsString()
    @IsOptional()
    badgeNumber?: string;
}
