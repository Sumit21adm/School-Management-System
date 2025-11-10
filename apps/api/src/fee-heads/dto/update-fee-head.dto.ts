import { IsString, IsOptional } from 'class-validator';

export class UpdateFeeHeadDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
