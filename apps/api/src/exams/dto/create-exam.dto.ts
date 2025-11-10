import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  term: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsDateString()
  @IsOptional()
  publishAt?: string;
}
