import { IsArray, ValidateNested, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentImportRowDto {
  @IsString()
  admissionNo: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  dob?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  sectionName?: string;

  @IsString()
  @IsOptional()
  className?: string;
}

export class ImportStudentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentImportRowDto)
  students: StudentImportRowDto[];

  @IsString()
  defaultPassword: string;
}
