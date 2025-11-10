import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class PromoteStudentsDto {
  @IsString()
  @IsNotEmpty()
  fromClassId: string;

  @IsString()
  @IsNotEmpty()
  toClassId: string;

  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minPercentage?: number;

  @IsString()
  @IsOptional()
  examId?: string;
}
