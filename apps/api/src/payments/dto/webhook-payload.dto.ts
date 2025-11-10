import { IsString, IsEnum } from 'class-validator';

export class WebhookPayloadDto {
  @IsString()
  txnRef: string;

  @IsString()
  invoiceId: string;

  @IsEnum(['success', 'failed'])
  status: string;

  @IsString()
  amount: string;
}
