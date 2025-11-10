import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FeePlanItemDto {
  @IsString()
  feeHeadId: string;

  @IsString()
  amount: string;

  @IsString()
  dueDate: string;
}

export class CreateFeePlanDto {
  @IsString()
  name: string;

  @IsString()
  classId: string;

  @IsString()
  academicYearId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeePlanItemDto)
  items: FeePlanItemDto[];
}
