import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

export enum AttendanceType {
  STUDENT = 'student',
  STAFF = 'staff',
}

export class QueryAttendanceDto {
  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsEnum(AttendanceType)
  type?: AttendanceType;
}
