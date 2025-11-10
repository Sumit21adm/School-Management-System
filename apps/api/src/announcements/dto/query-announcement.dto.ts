import { IsOptional, IsString, IsDateString } from 'class-validator';

export class QueryAnnouncementDto {
  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}
