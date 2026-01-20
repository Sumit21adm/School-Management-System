import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsDateString, IsEnum, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// STUDENT IMPORT DTOs
// ============================================

export class ImportStudentDto {
    @IsString()
    studentId: string;

    @IsString()
    name: string;

    @IsString()
    fatherName: string;

    @IsString()
    motherName: string;

    @IsDateString()
    dob: string;

    @IsString()
    gender: string;

    @IsString()
    className: string;

    @IsString()
    section: string;

    @IsString()
    @IsOptional()
    rollNumber?: string;

    @IsDateString()
    admissionDate: string;

    @IsString()
    address: string;

    @IsString()
    phone: string;

    @IsString()
    @IsOptional()
    whatsAppNo?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    religion?: string;

    @IsString()
    @IsOptional()
    aadharCardNo?: string;

    @IsString()
    @IsOptional()
    apaarId?: string;

    // Parent Details
    @IsString()
    @IsOptional()
    fatherOccupation?: string;

    @IsString()
    @IsOptional()
    fatherAadharNo?: string;

    @IsString()
    @IsOptional()
    fatherPanNo?: string;

    @IsString()
    @IsOptional()
    motherOccupation?: string;

    @IsString()
    @IsOptional()
    motherAadharNo?: string;

    @IsString()
    @IsOptional()
    motherPanNo?: string;

    // Guardian Details
    @IsString()
    @IsOptional()
    guardianRelation?: string;

    @IsString()
    @IsOptional()
    guardianName?: string;

    @IsString()
    @IsOptional()
    guardianOccupation?: string;

    @IsString()
    @IsOptional()
    guardianPhone?: string;

    @IsString()
    @IsOptional()
    guardianEmail?: string;

    @IsString()
    @IsOptional()
    guardianAadharNo?: string;

    @IsString()
    @IsOptional()
    guardianPanNo?: string;

    @IsString()
    @IsOptional()
    guardianAddress?: string;

    // Transport
    @IsString()
    @IsOptional()
    routeCode?: string;

    @IsString()
    @IsOptional()
    pickupStop?: string;

    @IsString()
    @IsOptional()
    dropStop?: string;

    @IsString()
    @IsOptional()
    transportType?: string;

    // Opening Balance
    @IsNumber()
    @IsOptional()
    @Min(0)
    previousDues?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    advanceBalance?: number;
}

// ============================================
// FEE RECEIPT IMPORT DTOs
// ============================================

export class ImportFeeReceiptDto {
    @IsString()
    studentId: string;

    @IsString()
    receiptNo: string;

    @IsDateString()
    receiptDate: string;

    @IsString()
    feeTypeName: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    discount?: number;

    @IsNumber()
    @Min(0)
    netAmount: number;

    @IsString()
    paymentMode: string;

    @IsString()
    @IsOptional()
    paymentRef?: string;

    @IsString()
    @IsOptional()
    collectedBy?: string;

    @IsString()
    @IsOptional()
    remarks?: string;

    @IsString()
    @IsOptional()
    billNo?: string;
}

// ============================================
// DEMAND BILL IMPORT DTOs
// ============================================

export class ImportDemandBillDto {
    @IsString()
    studentId: string;

    @IsString()
    billNo: string;

    @IsDateString()
    billDate: string;

    @IsDateString()
    dueDate: string;

    @IsNumber()
    @Min(1)
    month: number;

    @IsNumber()
    year: number;

    @IsString()
    feeTypeName: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    discount?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    previousDues?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    lateFee?: number;

    @IsNumber()
    @Min(0)
    netAmount: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    paidAmount?: number;

    @IsString()
    status: string;
}

// ============================================
// DISCOUNT IMPORT DTOs
// ============================================

export class ImportDiscountDto {
    @IsString()
    studentId: string;

    @IsString()
    feeTypeName: string;

    @IsString()
    discountType: string; // 'PERCENTAGE' | 'FIXED'

    @IsNumber()
    @Min(0)
    discountValue: number;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsString()
    @IsOptional()
    approvedBy?: string;
}

// ============================================
// VALIDATION & IMPORT RESULT DTOs
// ============================================

export class ValidationErrorDto {
    row: number;
    field: string;
    value: string;
    message: string;
}

export class ValidationResultDto {
    isValid: boolean;
    totalRows: number;
    validRows: number;
    errorCount: number;
    errors: ValidationErrorDto[];
    warnings: ValidationErrorDto[];
}

export class ImportResultDto {
    success: boolean;
    totalRows: number;
    imported: number;
    skipped: number;
    errors: ValidationErrorDto[];
}

export class ImportOptionsDto {
    @IsBoolean()
    @IsOptional()
    skipOnError?: boolean;  // Continue importing even if some rows fail

    @IsBoolean()
    @IsOptional()
    dryRun?: boolean;  // Validate only, don't import
}
