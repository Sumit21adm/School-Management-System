import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { FeePlanItemDto } from './create-fee-plan.dto';

export class UpdateFeePlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeePlanItemDto)
  @IsOptional()
  items?: FeePlanItemDto[];
}
