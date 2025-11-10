import { IsString, IsArray, IsOptional } from 'class-validator';

export class BulkGenerateInvoiceDto {
  @IsString()
  feePlanId: string;

  @IsArray()
  @IsOptional()
  studentIds?: string[];

  @IsString()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  sectionId?: string;
}
