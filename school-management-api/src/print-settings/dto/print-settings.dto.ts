import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdatePrintSettingsDto {
    @IsString()
    @MaxLength(200)
    schoolName: string;

    @IsString()
    schoolAddress: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    website?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    tagline?: string;

    // Affiliation & Certification
    @IsOptional()
    @IsString()
    @MaxLength(50)
    affiliationNo?: string;

    @IsOptional()
    @IsString()
    affiliationNote?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    isoCertifiedNote?: string;

    // Document-specific Notes
    @IsOptional()
    @IsString()
    demandBillNote?: string;

    @IsOptional()
    @IsString()
    feeReceiptNote?: string;

    @IsOptional()
    @IsString()
    admitCardNote?: string;

    @IsOptional()
    @IsString()
    transferCertNote?: string;

    @IsOptional()
    @IsString()
    idCardNote?: string;
}
