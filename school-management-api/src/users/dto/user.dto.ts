import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum, MinLength, IsArray } from 'class-validator';

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
    @MinLength(3)
    username: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    name: string;

    @IsEnum(UserRole)
    role: UserRole;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
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

