import { IsString, IsOptional, IsDateString, IsEnum, IsObject } from 'class-validator';

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsDateString()
  @IsOptional()
  dob?: string;

  @IsEnum(['male', 'female', 'other'])
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsEnum(['active', 'inactive', 'graduated', 'transferred'])
  @IsOptional()
  status?: string;

  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;
}
