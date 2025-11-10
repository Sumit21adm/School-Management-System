import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMarkDto {
  @IsString()
  @IsNotEmpty()
  examPaperId: string;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsNumber()
  @Min(0)
  marks: number;

  @IsString()
  @IsOptional()
  grade?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

class MarkEntryDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsNumber()
  @Min(0)
  marks: number;

  @IsString()
  @IsOptional()
  grade?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class BulkCreateMarksDto {
  @IsString()
  @IsNotEmpty()
  examPaperId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkEntryDto)
  marks: MarkEntryDto[];
}
