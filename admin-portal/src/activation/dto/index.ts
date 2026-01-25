import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, IsDateString } from 'class-validator';

export class CreateActivationDto {
    @IsNumber()
    @IsNotEmpty()
    organizationId: number;

    @IsOptional()
    @IsNumber()
    maxStudents?: number;

    @IsOptional()
    @IsNumber()
    maxUsers?: number;

    @IsOptional()
    @IsString()
    allowedModules?: string; // JSON string

    @IsOptional()
    @IsDateString()
    expiresAt?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class ActivateCodeDto {
    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsNotEmpty()
    machineId: string; // Hardware fingerprint

    @IsOptional()
    @IsString()
    ipAddress?: string;

    @IsOptional()
    @IsString()
    instanceName?: string; // "Production", "Staging", etc.
}

export class HeartbeatDto {
    @IsOptional()
    @IsNumber()
    activationId?: number;

    @IsOptional()
    @IsString()
    code?: string;

    @IsString()
    @IsNotEmpty()
    machineId: string;

    @IsNumber()
    studentCount: number;

    @IsNumber()
    userCount: number;

    @IsOptional()
    @IsString()
    ipAddress?: string;

    @IsOptional()
    @IsString()
    appVersion?: string;
}

export class ValidateCodeDto {
    @IsString()
    @IsNotEmpty()
    code: string;
}

export class RevokeCodeDto {
    @IsOptional()
    @IsString()
    reason?: string;
}
