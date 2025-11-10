import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Header } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransportService } from './transport.service';

@Controller('transport')
@UseGuards(AuthGuard('jwt'))
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  // ============ Routes ============
  @Get('routes')
  findAllRoutes(@Request() req: any) {
    return this.transportService.findAllRoutes(req.user.tenantId);
  }

  @Get('routes/:id')
  findRouteById(@Param('id') id: string, @Request() req: any) {
    return this.transportService.findRouteById(id, req.user.tenantId);
  }

  @Post('routes')
  createRoute(@Request() req: any, @Body() body: any) {
    return this.transportService.createRoute(req.user.tenantId, body);
  }

  @Put('routes/:id')
  updateRoute(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.transportService.updateRoute(id, req.user.tenantId, body);
  }

  @Delete('routes/:id')
  deleteRoute(@Param('id') id: string, @Request() req: any) {
    return this.transportService.deleteRoute(id, req.user.tenantId);
  }

  // ============ Stops ============
  @Get('routes/:routeId/stops')
  findStopsByRoute(@Param('routeId') routeId: string) {
    return this.transportService.findStopsByRoute(routeId);
  }

  @Post('stops')
  createStop(@Body() body: any) {
    return this.transportService.createStop(body);
  }

  @Put('stops/:id')
  updateStop(@Param('id') id: string, @Body() body: any) {
    return this.transportService.updateStop(id, body);
  }

  @Delete('stops/:id')
  deleteStop(@Param('id') id: string) {
    return this.transportService.deleteStop(id);
  }

  // ============ Vehicles ============
  @Get('vehicles')
  findAllVehicles(@Request() req: any, @Query('status') status?: string) {
    return this.transportService.findAllVehicles(req.user.tenantId, { status });
  }

  @Get('vehicles/:id')
  findVehicleById(@Param('id') id: string, @Request() req: any) {
    return this.transportService.findVehicleById(id, req.user.tenantId);
  }

  @Post('vehicles')
  createVehicle(@Request() req: any, @Body() body: any) {
    return this.transportService.createVehicle(req.user.tenantId, body);
  }

  @Put('vehicles/:id')
  updateVehicle(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.transportService.updateVehicle(id, req.user.tenantId, body);
  }

  @Delete('vehicles/:id')
  deleteVehicle(@Param('id') id: string, @Request() req: any) {
    return this.transportService.deleteVehicle(id, req.user.tenantId);
  }

  // ============ Allocations ============
  @Get('allocations')
  findAllAllocations(
    @Request() req: any,
    @Query('routeId') routeId?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: string,
  ) {
    return this.transportService.findAllAllocations(req.user.tenantId, { routeId, vehicleId, status });
  }

  @Post('allocations')
  createAllocation(@Request() req: any, @Body() body: any) {
    return this.transportService.createAllocation(req.user.tenantId, body);
  }

  @Put('allocations/:id')
  updateAllocation(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.transportService.updateAllocation(id, req.user.tenantId, body);
  }

  @Delete('allocations/:id')
  deleteAllocation(@Param('id') id: string, @Request() req: any) {
    return this.transportService.deleteAllocation(id, req.user.tenantId);
  }

  // ============ Statistics ============
  @Get('stats')
  getStats(@Request() req: any) {
    return this.transportService.getStats(req.user.tenantId);
  }

  // ============ CSV Export ============
  @Get('export/routes')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="transport-routes.csv"')
  async exportRoutesCSV(@Request() req: any) {
    const routes = await this.transportService.exportRoutesCSV(req.user.tenantId);
    return this.convertToCSV(routes, ['id', 'name', 'description', 'stopsCount', 'allocationsCount']);
  }

  @Get('export/vehicles')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="transport-vehicles.csv"')
  async exportVehiclesCSV(@Request() req: any) {
    const vehicles = await this.transportService.exportVehiclesCSV(req.user.tenantId);
    return this.convertToCSV(vehicles, ['id', 'vehicleNumber', 'type', 'capacity', 'driver', 'phone', 'status', 'allocationsCount']);
  }

  @Get('export/allocations')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="transport-allocations.csv"')
  async exportAllocationsCSV(@Request() req: any) {
    const allocations = await this.transportService.exportAllocationsCSV(req.user.tenantId);
    return this.convertToCSV(allocations, ['id', 'studentName', 'studentEmail', 'routeName', 'vehicleNumber', 'stopName', 'status']);
  }

  private convertToCSV(data: any[], headers: string[]): string {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',');
    });
    return [csvHeaders, ...csvRows].join('\n');
  }
}
