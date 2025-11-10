import { IsString, IsDateString, IsArray, ValidateNested, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum AttendanceStatus {
  PRESENT = 'P',
  ABSENT = 'A',
  LEAVE = 'L',
  HOLIDAY = 'H',
}

export class AttendanceEntryDto {
  @IsString()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateAttendanceDto {
  @IsDateString()
  date: string;

  @IsString()
  sectionId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  entries: AttendanceEntryDto[];
}
