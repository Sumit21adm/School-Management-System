import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsString()
  feeHeadId: string;

  @IsString()
  amount: string;
}

export class CreateInvoiceDto {
  @IsString()
  studentId: string;

  @IsString()
  dueDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}
