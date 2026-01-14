import { IsString, IsOptional, IsInt, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRouteStopDto {
    @IsString()
    stopName: string;

    @IsInt()
    stopOrder: number;

    @IsOptional()
    @IsString()
    pickupTime?: string;

    @IsOptional()
    @IsString()
    dropTime?: string;

    @IsOptional()
    @IsString()
    landmark?: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;
}

export class CreateRouteDto {
    @IsString()
    routeName: string;

    @IsString()
    routeCode: string;

    @IsString()
    startPoint: string;

    @IsString()
    endPoint: string;

    @IsOptional()
    @IsNumber()
    distance?: number;

    @IsOptional()
    @IsInt()
    estimatedTime?: number;

    @IsOptional()
    @IsString()
    morningDeparture?: string;

    @IsOptional()
    @IsString()
    eveningDeparture?: string;

    @IsNumber()
    monthlyFee: number;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsInt()
    vehicleId?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateRouteStopDto)
    stops?: CreateRouteStopDto[];
}

export class UpdateRouteDto {
    @IsOptional()
    @IsString()
    routeName?: string;

    @IsOptional()
    @IsString()
    routeCode?: string;

    @IsOptional()
    @IsString()
    startPoint?: string;

    @IsOptional()
    @IsString()
    endPoint?: string;

    @IsOptional()
    @IsNumber()
    distance?: number;

    @IsOptional()
    @IsInt()
    estimatedTime?: number;

    @IsOptional()
    @IsString()
    morningDeparture?: string;

    @IsOptional()
    @IsString()
    eveningDeparture?: string;

    @IsOptional()
    @IsNumber()
    monthlyFee?: number;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsInt()
    vehicleId?: number;
}

export class UpdateRouteStopDto {
    @IsOptional()
    @IsString()
    stopName?: string;

    @IsOptional()
    @IsInt()
    stopOrder?: number;

    @IsOptional()
    @IsString()
    pickupTime?: string;

    @IsOptional()
    @IsString()
    dropTime?: string;

    @IsOptional()
    @IsString()
    landmark?: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;
}
