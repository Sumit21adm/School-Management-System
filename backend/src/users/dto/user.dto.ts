import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum, MinLength, IsArray, IsNotEmpty, Matches } from 'class-validator';

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    ACCOUNTANT = 'ACCOUNTANT',
    TEACHER = 'TEACHER',
    COORDINATOR = 'COORDINATOR',
    RECEPTIONIST = 'RECEPTIONIST',
    SECURITY = 'SECURITY',
    PARENT = 'PARENT',
    STUDENT = 'STUDENT',
}

export class CreateUserDto {
    @IsString()
    @MinLength(3, { message: 'Username must be at least 3 characters' })
    @IsNotEmpty({ message: 'Username is required' })
    username: string;

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    @IsNotEmpty({ message: 'Password is required' })
    password: string;

    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name: string;

    @IsEnum(UserRole, { message: 'Invalid role' })
    role: UserRole;

    @IsEmail({}, { message: 'Please enter a valid email address' })
    @IsOptional()
    email?: string;

    @IsString()
    @Matches(/^[6-9]\d{9}$/, { message: 'Please enter a valid 10-digit phone number' })
    @IsOptional()
    phone?: string;

    @IsArray()
    @IsOptional()
    permissions?: string[];
}

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsBoolean()
    @IsOptional()
    active?: boolean;

    @IsArray()
    @IsOptional()
    permissions?: string[];
}

export class ChangePasswordDto {
    @IsString()
    @MinLength(6)
    newPassword: string;
}

