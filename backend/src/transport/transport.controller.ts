import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { TransportService } from './transport.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { CreateDriverDto, UpdateDriverDto } from './dto/driver.dto';
import { CreateRouteDto, UpdateRouteDto, CreateRouteStopDto, UpdateRouteStopDto } from './dto/route.dto';
import { AssignTransportDto, UpdateTransportAssignmentDto, BulkAssignTransportDto } from './dto/assignment.dto';
import { CreateFareSlabDto, UpdateFareSlabDto } from './dto/fare-slab.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('transport')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransportController {
    constructor(private readonly transportService: TransportService) { }

    // ============================================
    // VEHICLE ENDPOINTS
    // ============================================

    @Get('vehicles')
    @Roles('RECEPTIONIST')
    findAllVehicles(@Query('status') status?: string) {
        return this.transportService.findAllVehicles(status);
    }

    @Get('vehicles/:id')
    @Roles('RECEPTIONIST')
    findVehicleById(@Param('id', ParseIntPipe) id: number) {
        return this.transportService.findVehicleById(id);
    }

    @Post('vehicles')
    @Roles('ADMIN')
    createVehicle(@Body() createVehicleDto: CreateVehicleDto) {
        return this.transportService.createVehicle(createVehicleDto);
    }

    @Patch('vehicles/:id')
    @Roles('ADMIN')
    updateVehicle(@Param('id', ParseIntPipe) id: number, @Body() updateVehicleDto: UpdateVehicleDto) {
        return this.transportService.updateVehicle(id, updateVehicleDto);
    }

    @Delete('vehicles/:id')
    @Roles('ADMIN')
    deleteVehicle(@Param('id', ParseIntPipe) id: number) {
        return this.transportService.deleteVehicle(id);
    }

    // ============================================
    // DRIVER ENDPOINTS
    // ============================================

    @Get('drivers')
    @Roles('RECEPTIONIST')
    findAllDrivers(@Query('status') status?: string) {
        return this.transportService.findAllDrivers(status);
    }

    @Get('drivers/:id')
    @Roles('RECEPTIONIST')
    findDriverById(@Param('id', ParseIntPipe) id: number) {
        return this.transportService.findDriverById(id);
    }

    @Post('drivers')
    @Roles('ADMIN')
    createDriver(@Body() createDriverDto: CreateDriverDto) {
        return this.transportService.createDriver(createDriverDto);
    }

    @Patch('drivers/:id')
    @Roles('ADMIN')
    updateDriver(@Param('id', ParseIntPipe) id: number, @Body() updateDriverDto: UpdateDriverDto) {
        return this.transportService.updateDriver(id, updateDriverDto);
    }

    @Delete('drivers/:id')
    @Roles('ADMIN')
    deleteDriver(@Param('id', ParseIntPipe) id: number) {
        return this.transportService.deleteDriver(id);
    }

    // ============================================
    // ROUTE ENDPOINTS
    // ============================================

    @Get('routes')
    @Roles('RECEPTIONIST')
    findAllRoutes(@Query('status') status?: string) {
        return this.transportService.findAllRoutes(status);
    }

    @Get('routes/:id')
    @Roles('RECEPTIONIST')
    findRouteById(@Param('id', ParseIntPipe) id: number) {
        return this.transportService.findRouteById(id);
    }

    @Post('routes')
    @Roles('ADMIN')
    createRoute(@Body() createRouteDto: CreateRouteDto) {
        return this.transportService.createRoute(createRouteDto);
    }

    @Patch('routes/:id')
    @Roles('ADMIN')
    updateRoute(@Param('id', ParseIntPipe) id: number, @Body() updateRouteDto: UpdateRouteDto) {
        return this.transportService.updateRoute(id, updateRouteDto);
    }

    @Delete('routes/:id')
    @Roles('ADMIN')
    deleteRoute(@Param('id', ParseIntPipe) id: number) {
        return this.transportService.deleteRoute(id);
    }

    // ============================================
    // ROUTE STOP ENDPOINTS
    // ============================================

    @Post('routes/:id/stops')
    @Roles('ADMIN')
    addStopToRoute(@Param('id', ParseIntPipe) routeId: number, @Body() createStopDto: CreateRouteStopDto) {
        return this.transportService.addStopToRoute(routeId, createStopDto);
    }

    @Patch('routes/:routeId/stops/:stopId')
    @Roles('ADMIN')
    updateStop(
        @Param('routeId', ParseIntPipe) routeId: number,
        @Param('stopId', ParseIntPipe) stopId: number,
        @Body() updateStopDto: UpdateRouteStopDto,
    ) {
        return this.transportService.updateStop(routeId, stopId, updateStopDto);
    }

    @Delete('routes/:routeId/stops/:stopId')
    @Roles('ADMIN')
    deleteStop(
        @Param('routeId', ParseIntPipe) routeId: number,
        @Param('stopId', ParseIntPipe) stopId: number,
    ) {
        return this.transportService.deleteStop(routeId, stopId);
    }

    // ============================================
    // ASSIGNMENT ENDPOINTS
    // ============================================

    @Get('assignments')
    @Roles('RECEPTIONIST')
    findAllAssignments(@Query('routeId') routeId?: string, @Query('status') status?: string) {
        const routeIdInt = routeId ? parseInt(routeId) : undefined;
        return this.transportService.findAllAssignments(routeIdInt, status);
    }

    @Get('assignments/student/:studentId')
    @Roles('RECEPTIONIST')
    findAssignmentByStudent(@Param('studentId') studentId: string) {
        return this.transportService.findAssignmentByStudent(studentId);
    }

    @Post('assignments')
    @Roles('RECEPTIONIST')
    assignTransport(@Body() assignTransportDto: AssignTransportDto) {
        return this.transportService.assignTransport(assignTransportDto);
    }

    @Post('assignments/bulk')
    @Roles('ADMIN') // Bulk is explicit admin action
    bulkAssignTransport(@Body() bulkAssignDto: BulkAssignTransportDto) {
        return this.transportService.bulkAssignTransport(bulkAssignDto);
    }

    @Patch('assignments/:id')
    @Roles('RECEPTIONIST')
    updateAssignment(@Param('id', ParseIntPipe) id: number, @Body() updateAssignmentDto: UpdateTransportAssignmentDto) {
        return this.transportService.updateAssignment(id, updateAssignmentDto);
    }

    @Delete('assignments/:id')
    @Roles('RECEPTIONIST')
    removeAssignment(@Param('id', ParseIntPipe) id: number) {
        return this.transportService.removeAssignment(id);
    }

    // ============================================
    // REPORT ENDPOINTS
    // ============================================

    @Get('reports/route-wise')
    @Roles('COORDINATOR')
    getRouteWiseReport() {
        return this.transportService.getRouteWiseReport();
    }

    @Get('reports/stop-wise/:routeId')
    @Roles('COORDINATOR')
    getStopWiseReport(@Param('routeId', ParseIntPipe) routeId: number) {
        return this.transportService.getStopWiseReport(routeId);
    }

    // ============================================
    // FARE SLAB ENDPOINTS
    // ============================================

    @Get('fare-slabs')
    @Roles('RECEPTIONIST')
    findAllFareSlabs(@Query('activeOnly') activeOnly?: string) {
        return this.transportService.findAllFareSlabs(activeOnly === 'true');
    }

    @Post('fare-slabs')
    @Roles('ADMIN')
    createFareSlab(@Body() createFareSlabDto: CreateFareSlabDto) {
        return this.transportService.createFareSlab(createFareSlabDto);
    }

    @Patch('fare-slabs/:id')
    @Roles('ADMIN')
    updateFareSlab(@Param('id', ParseIntPipe) id: number, @Body() updateFareSlabDto: UpdateFareSlabDto) {
        return this.transportService.updateFareSlab(id, updateFareSlabDto);
    }

    @Delete('fare-slabs/:id')
    @Roles('ADMIN')
    deleteFareSlab(@Param('id', ParseIntPipe) id: number) {
        return this.transportService.deleteFareSlab(id);
    }
}
