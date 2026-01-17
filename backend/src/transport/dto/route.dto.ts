import { IsString, IsOptional, IsInt, IsNumber, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRouteStopDto {
    @IsString()
    @IsNotEmpty({ message: 'Stop name is required' })
    stopName: string;

    @IsInt()
    @IsNotEmpty({ message: 'Stop order is required' })
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

    @IsOptional()
    @IsNumber()
    distanceFromSchool?: number;
}

export class CreateRouteDto {
    @IsString()
    @IsNotEmpty({ message: 'Route name is required' })
    routeName: string;

    @IsString()
    @IsNotEmpty({ message: 'Route code is required' })
    routeCode: string;

    @IsString()
    @IsNotEmpty({ message: 'Start point is required' })
    startPoint: string;

    @IsString()
    @IsNotEmpty({ message: 'End point is required' })
    endPoint: string;

    @IsOptional()
    @IsString()
    viaPoints?: string;

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

    // monthlyFee removed


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
    @IsString()
    viaPoints?: string;

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

    // monthlyFee removed


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

    @IsOptional()
    @IsNumber()
    distanceFromSchool?: number;
}
