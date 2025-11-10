import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  invoiceId: string;

  @IsString()
  amount: string;

  @IsEnum(['cash', 'card', 'online', 'bank_transfer'])
  method: string;

  @IsString()
  @IsOptional()
  txnRef?: string;
}
