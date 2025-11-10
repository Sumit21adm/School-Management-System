import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class GradeScaleItem {
  @IsString()
  @IsNotEmpty()
  grade: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  minPercentage: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercentage: number;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreateGradeScaleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeScaleItem)
  scales: GradeScaleItem[];
}
