import { IsString, IsOptional, IsInt, IsNumber, IsDateString, Min, Max } from 'class-validator';

export class CreateVehicleDto {
    @IsString()
    vehicleNo: string;

    @IsString()
    vehicleType: string;

    @IsInt()
    @Min(1)
    @Max(100)
    capacity: number;

    @IsOptional()
    @IsString()
    make?: string;

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsInt()
    year?: number;

    @IsOptional()
    @IsString()
    insuranceNo?: string;

    @IsOptional()
    @IsDateString()
    insuranceExpiry?: string;

    @IsOptional()
    @IsDateString()
    fitnessExpiry?: string;

    @IsOptional()
    @IsDateString()
    permitExpiry?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsInt()
    driverId?: number;
}

export class UpdateVehicleDto {
    @IsOptional()
    @IsString()
    vehicleNo?: string;

    @IsOptional()
    @IsString()
    vehicleType?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    capacity?: number;

    @IsOptional()
    @IsString()
    make?: string;

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsInt()
    year?: number;

    @IsOptional()
    @IsString()
    insuranceNo?: string;

    @IsOptional()
    @IsDateString()
    insuranceExpiry?: string;

    @IsOptional()
    @IsDateString()
    fitnessExpiry?: string;

    @IsOptional()
    @IsDateString()
    permitExpiry?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsInt()
    driverId?: number;
}
