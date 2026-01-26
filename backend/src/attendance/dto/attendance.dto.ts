import { IsNotEmpty, IsNumber, IsString, IsDateString, IsOptional, ValidateNested, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum AttendanceStatus {
    PRESENT = 'present',
    ABSENT = 'absent',
    LATE = 'late',
    HALF_DAY = 'half_day',
    LEAVE = 'leave',
}

export class MarkAttendanceDto {
    @IsNotEmpty()
    @IsString()
    studentId: string;

    @IsNotEmpty()
    @IsDateString()
    date: string;

    @IsNotEmpty()
    @IsString()
    status: string;

    @IsOptional()
    @IsString()
    remarks?: string;

    @IsOptional()
    @IsString() // "08:30"
    inTime?: string;

    @IsOptional()
    @IsString() // "14:30"
    outTime?: string;
}

export class BulkAttendanceItemDto {
    @IsNotEmpty()
    @IsString()
    studentId: string;

    @IsNotEmpty()
    @IsString()
    status: string; // present, absent, etc.

    @IsOptional()
    @IsString()
    remarks?: string;
}

export class CreateModelAttendanceDto {
    @IsNotEmpty()
    @IsDateString()
    date: string;

    @IsNotEmpty()
    @IsNumber()
    sessionId: number;

    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkAttendanceItemDto)
    items: BulkAttendanceItemDto[];
}

export class CreateHolidayDto {
    @IsNotEmpty()
    @IsDateString()
    date: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsEnum(['national', 'religious', 'school'])
    type: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsNumber()
    sessionId: number;
}
