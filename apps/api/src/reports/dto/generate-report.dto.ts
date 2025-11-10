import { IsEnum, IsOptional, IsString, IsDateString, IsArray } from 'class-validator';

export enum ReportType {
  STUDENTS = 'students',
  ATTENDANCE = 'attendance',
  FEES = 'fees',
  EXAMS = 'exams',
  STAFF = 'staff',
}

export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
}

export class GenerateReportDto {
  @IsEnum(ReportType)
  type: ReportType;

  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];
}
