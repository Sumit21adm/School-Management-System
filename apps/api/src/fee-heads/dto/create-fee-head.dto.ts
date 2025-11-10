import { IsString, IsOptional } from 'class-validator';

export class CreateFeeHeadDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
