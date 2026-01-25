import { IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateSubscriptionDto {
    @IsNumber()
    organizationId: number;

    @IsNumber()
    planId: number;

    @IsOptional()
    @IsEnum(['MONTHLY', 'YEARLY'])
    billingCycle?: 'MONTHLY' | 'YEARLY';
}
