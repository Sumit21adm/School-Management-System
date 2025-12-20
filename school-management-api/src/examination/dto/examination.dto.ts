import { IsString, IsBoolean, IsOptional, MaxLength, IsInt, IsDateString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

// ExamType DTOs
export class CreateExamTypeDto {
    @IsString()
    @MaxLength(50)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    description?: string;
}

export class UpdateExamTypeDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

// Subject DTOs
export class CreateSubjectDto {
    @IsString()
    @MaxLength(50)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    code?: string;
}

export class UpdateSubjectDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    code?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

// Exam Schedule DTO
export class CreateExamScheduleDto {
    @IsInt()
    subjectId: number;

    @IsString()
    @MaxLength(20)
    className: string;

    @IsDateString()
    date: string;

    @IsString() // Using string for Time for simplicity in DTO, but validation might need regex or Date
    // Actually, Prisma DateTime @db.Time maps to Date object in JS usually, but input might be HH:MM string.
    // Let's expect ISO string or HH:mm string. 
    // Ideally we pass full DateTime strings for start/end or keep them as ISO strings.
    // Input for Time in many frameworks is often just a string.
    // Let's assume we pass a full ISO string for now and extract time, or just a string.
    // Based on Prisma `DateTime @db.Time`, it expects a Date object or ISO-8601 string.
    // Let's use IsDateString to be safe, assuming client sends full date-time.
    // Wait, if it's just Time, maybe the client sends '10:00:00'.
    // Let's treat it as string and handle conversion in service if needed, or use IsDateString if we send full ISO.
    // Let's stick to IsDateString which is safer for "DateTime" type in Prisma.
    startTime: string;

    @IsDateString()
    endTime: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    roomNo?: string;
}

// Exam DTOs
export class CreateExamDto {
    @IsString()
    @MaxLength(100)
    name: string;

    @IsInt()
    examTypeId: number;

    @IsInt()
    sessionId: number;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateExamScheduleDto)
    schedules?: CreateExamScheduleDto[];
}

export class UpdateExamDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    status?: string;
}
