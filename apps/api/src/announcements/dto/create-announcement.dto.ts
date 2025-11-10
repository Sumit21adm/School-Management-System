import { IsString, IsDateString, IsJSON, IsOptional } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsJSON()
  audience: string; // JSON string with filter criteria

  @IsDateString()
  publishAt: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
