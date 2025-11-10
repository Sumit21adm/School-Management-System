import { IsString, IsOptional, IsDateString, IsEnum, IsObject, IsEmail, MinLength } from 'class-validator';

export class CreateStudentDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  admissionNo: string;

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

  @IsDateString()
  @IsOptional()
  admissionDate?: string;

  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;
}
