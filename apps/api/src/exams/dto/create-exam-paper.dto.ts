import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateExamPaperDto {
  @IsString()
  @IsNotEmpty()
  examId: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsNumber()
  @Min(1)
  maxMarks: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  duration?: number;
}
