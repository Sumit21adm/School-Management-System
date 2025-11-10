import { IsString, IsDateString, IsJSON, IsOptional } from 'class-validator';

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsJSON()
  audience?: string;

  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
