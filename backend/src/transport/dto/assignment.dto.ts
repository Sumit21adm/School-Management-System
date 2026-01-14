import { IsString, IsOptional, IsInt, IsDateString, IsArray } from 'class-validator';

export class AssignTransportDto {
    @IsString()
    studentId: string;

    @IsInt()
    routeId: number;

    @IsOptional()
    @IsInt()
    pickupStopId?: number;

    @IsOptional()
    @IsInt()
    dropStopId?: number;

    @IsOptional()
    @IsString()
    transportType?: string; // pickup, drop, both

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateTransportAssignmentDto {
    @IsOptional()
    @IsInt()
    routeId?: number;

    @IsOptional()
    @IsInt()
    pickupStopId?: number;

    @IsOptional()
    @IsInt()
    dropStopId?: number;

    @IsOptional()
    @IsString()
    transportType?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class BulkAssignTransportDto {
    @IsArray()
    @IsString({ each: true })
    studentIds: string[];

    @IsInt()
    routeId: number;

    @IsOptional()
    @IsInt()
    pickupStopId?: number;

    @IsOptional()
    @IsInt()
    dropStopId?: number;

    @IsOptional()
    @IsString()
    transportType?: string;
}
