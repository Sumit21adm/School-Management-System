import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpException, HttpStatus, Header } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HostelService } from './hostel.service';

@Controller('hostel')
@UseGuards(AuthGuard('jwt'))
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  // ============ Buildings ============
  @Get('buildings')
  findAllBuildings(@Request() req: any) {
    return this.hostelService.findAllBuildings(req.user.tenantId);
  }

  @Get('buildings/:id')
  findBuildingById(@Param('id') id: string, @Request() req: any) {
    return this.hostelService.findBuildingById(id, req.user.tenantId);
  }

  @Post('buildings')
  createBuilding(@Request() req: any, @Body() body: any) {
    return this.hostelService.createBuilding(req.user.tenantId, body);
  }

  @Put('buildings/:id')
  updateBuilding(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.hostelService.updateBuilding(id, req.user.tenantId, body);
  }

  @Delete('buildings/:id')
  deleteBuilding(@Param('id') id: string, @Request() req: any) {
    return this.hostelService.deleteBuilding(id, req.user.tenantId);
  }

  // ============ Rooms ============
  @Get('buildings/:buildingId/rooms')
  findRoomsByBuilding(@Param('buildingId') buildingId: string) {
    return this.hostelService.findRoomsByBuilding(buildingId);
  }

  @Get('rooms/:id')
  findRoomById(@Param('id') id: string) {
    return this.hostelService.findRoomById(id);
  }

  @Post('rooms')
  createRoom(@Body() body: any) {
    return this.hostelService.createRoom(body);
  }

  @Put('rooms/:id')
  updateRoom(@Param('id') id: string, @Body() body: any) {
    return this.hostelService.updateRoom(id, body);
  }

  @Delete('rooms/:id')
  deleteRoom(@Param('id') id: string) {
    return this.hostelService.deleteRoom(id);
  }

  // ============ Allocations ============
  @Get('allocations')
  findAllAllocations(
    @Request() req: any,
    @Query('roomId') roomId?: string,
    @Query('status') status?: string,
  ) {
    return this.hostelService.findAllAllocations(req.user.tenantId, { roomId, status });
  }

  @Post('allocations')
  async createAllocation(@Request() req: any, @Body() body: any) {
    try {
      return await this.hostelService.createAllocation(req.user.tenantId, body);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('allocations/:id')
  updateAllocation(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.hostelService.updateAllocation(id, req.user.tenantId, body);
  }

  @Put('allocations/:id/checkout')
  async checkOutAllocation(@Param('id') id: string, @Request() req: any) {
    try {
      return await this.hostelService.checkOutAllocation(id, req.user.tenantId);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('allocations/:id')
  deleteAllocation(@Param('id') id: string, @Request() req: any) {
    return this.hostelService.deleteAllocation(id, req.user.tenantId);
  }

  // ============ Attendance ============
  @Get('attendance')
  findAttendance(
    @Request() req: any,
    @Query('date') date?: string,
    @Query('studentId') studentId?: string,
  ) {
    const filters: any = {};
    if (date) filters.date = new Date(date);
    if (studentId) filters.studentId = studentId;
    return this.hostelService.findAttendance(req.user.tenantId, filters);
  }

  @Post('attendance')
  markAttendance(@Request() req: any, @Body() body: any) {
    return this.hostelService.markAttendance(req.user.tenantId, body);
  }

  // ============ Statistics ============
  @Get('stats')
  getStats(@Request() req: any) {
    return this.hostelService.getStats(req.user.tenantId);
  }

  // ============ CSV Export ============
  @Get('export/buildings')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="hostel-buildings.csv"')
  async exportBuildingsCSV(@Request() req: any) {
    const buildings = await this.hostelService.exportBuildingsCSV(req.user.tenantId);
    return this.convertToCSV(buildings, ['id', 'name', 'type', 'address', 'warden', 'phone', 'roomsCount']);
  }

  @Get('export/rooms')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="hostel-rooms.csv"')
  async exportRoomsCSV(@Request() req: any) {
    const rooms = await this.hostelService.exportRoomsCSV(req.user.tenantId);
    return this.convertToCSV(rooms, ['id', 'buildingName', 'roomNumber', 'floor', 'capacity', 'type', 'status', 'occupiedBeds']);
  }

  @Get('export/allocations')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="hostel-allocations.csv"')
  async exportAllocationsCSV(@Request() req: any) {
    const allocations = await this.hostelService.exportAllocationsCSV(req.user.tenantId);
    return this.convertToCSV(allocations, ['id', 'studentName', 'studentEmail', 'buildingName', 'roomNumber', 'bedNumber', 'checkIn', 'checkOut', 'status']);
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
