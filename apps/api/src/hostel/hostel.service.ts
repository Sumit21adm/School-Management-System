import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HostelService {
  constructor(private prisma: PrismaService) {}

  // ============ Buildings ============
  async findAllBuildings(tenantId: string) {
    return this.prisma.hostelBuilding.findMany({
      where: { tenantId },
      include: {
        rooms: {
          include: {
            allocations: {
              where: { status: 'active' },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findBuildingById(id: string, tenantId: string) {
    return this.prisma.hostelBuilding.findFirst({
      where: { id, tenantId },
      include: {
        rooms: {
          include: {
            allocations: {
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async createBuilding(tenantId: string, data: any) {
    return this.prisma.hostelBuilding.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  async updateBuilding(id: string, tenantId: string, data: any) {
    return this.prisma.hostelBuilding.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async deleteBuilding(id: string, tenantId: string) {
    return this.prisma.hostelBuilding.deleteMany({
      where: { id, tenantId },
    });
  }

  // ============ Rooms ============
  async findRoomsByBuilding(buildingId: string) {
    return this.prisma.hostelRoom.findMany({
      where: { buildingId },
      include: {
        allocations: {
          where: { status: 'active' },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        building: true,
      },
      orderBy: {
        roomNumber: 'asc',
      },
    });
  }

  async findRoomById(id: string) {
    return this.prisma.hostelRoom.findUnique({
      where: { id },
      include: {
        building: true,
        allocations: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  async createRoom(data: any) {
    return this.prisma.hostelRoom.create({
      data,
    });
  }

  async updateRoom(id: string, data: any) {
    return this.prisma.hostelRoom.update({
      where: { id },
      data,
    });
  }

  async deleteRoom(id: string) {
    return this.prisma.hostelRoom.delete({
      where: { id },
    });
  }

  // ============ Allocations ============
  async findAllAllocations(tenantId: string, filters?: { roomId?: string; status?: string }) {
    return this.prisma.hostelAllocation.findMany({
      where: {
        tenantId,
        ...(filters?.roomId && { roomId: filters.roomId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        room: {
          include: {
            building: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createAllocation(tenantId: string, data: any) {
    // Check room availability
    const room = await this.prisma.hostelRoom.findUnique({
      where: { id: data.roomId },
      include: {
        allocations: {
          where: { status: 'active' },
        },
      },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.allocations.length >= room.capacity) {
      throw new Error('Room is full');
    }

    const allocation = await this.prisma.hostelAllocation.create({
      data: {
        tenantId,
        ...data,
      },
    });

    // Update room status if full
    if (room.allocations.length + 1 >= room.capacity) {
      await this.prisma.hostelRoom.update({
        where: { id: data.roomId },
        data: { status: 'full' },
      });
    }

    return allocation;
  }

  async updateAllocation(id: string, tenantId: string, data: any) {
    return this.prisma.hostelAllocation.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async checkOutAllocation(id: string, tenantId: string) {
    const allocation = await this.prisma.hostelAllocation.findFirst({
      where: { id, tenantId },
    });

    if (!allocation) {
      throw new Error('Allocation not found');
    }

    const updated = await this.prisma.hostelAllocation.update({
      where: { id },
      data: {
        status: 'checked_out',
        checkOut: new Date(),
      },
    });

    // Update room status to available if it was full
    await this.prisma.hostelRoom.update({
      where: { id: allocation.roomId },
      data: { status: 'available' },
    });

    return updated;
  }

  async deleteAllocation(id: string, tenantId: string) {
    return this.prisma.hostelAllocation.deleteMany({
      where: { id, tenantId },
    });
  }

  // ============ Attendance ============
  async findAttendance(tenantId: string, filters?: { date?: Date; studentId?: string }) {
    return this.prisma.hostelAttendance.findMany({
      where: {
        tenantId,
        ...(filters?.date && { date: filters.date }),
        ...(filters?.studentId && { studentId: filters.studentId }),
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async markAttendance(tenantId: string, data: any) {
    return this.prisma.hostelAttendance.upsert({
      where: {
        tenantId_studentId_date: {
          tenantId,
          studentId: data.studentId,
          date: data.date,
        },
      },
      update: {
        status: data.status,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        note: data.note,
      },
      create: {
        tenantId,
        ...data,
      },
    });
  }

  // ============ Statistics ============
  async getStats(tenantId: string) {
    const totalBuildings = await this.prisma.hostelBuilding.count({
      where: { tenantId },
    });

    const totalRooms = await this.prisma.hostelRoom.count({
      where: {
        building: {
          tenantId,
        },
      },
    });

    const occupiedRooms = await this.prisma.hostelRoom.count({
      where: {
        building: {
          tenantId,
        },
        status: 'full',
      },
    });

    const totalAllocations = await this.prisma.hostelAllocation.count({
      where: { tenantId, status: 'active' },
    });

    return {
      totalBuildings,
      totalRooms,
      occupiedRooms,
      totalAllocations,
    };
  }

  // ============ CSV Export ============
  async exportBuildingsCSV(tenantId: string) {
    const buildings = await this.findAllBuildings(tenantId);
    return buildings.map((building: any) => ({
      id: building.id,
      name: building.name,
      type: building.type,
      address: building.address,
      warden: building.warden,
      phone: building.phone,
      roomsCount: building.rooms.length,
    }));
  }

  async exportRoomsCSV(tenantId: string) {
    const buildings = await this.findAllBuildings(tenantId);
    const rooms: any[] = [];
    buildings.forEach((building: any) => {
      building.rooms.forEach((room: any) => {
        rooms.push({
          id: room.id,
          buildingName: building.name,
          roomNumber: room.roomNumber,
          floor: room.floor,
          capacity: room.capacity,
          type: room.type,
          status: room.status,
          occupiedBeds: room.allocations.length,
        });
      });
    });
    return rooms;
  }

  async exportAllocationsCSV(tenantId: string) {
    const allocations = await this.findAllAllocations(tenantId);
    return allocations.map((allocation: any) => ({
      id: allocation.id,
      studentName: `${allocation.student.user.firstName} ${allocation.student.user.lastName}`,
      studentEmail: allocation.student.user.email,
      buildingName: allocation.room.building.name,
      roomNumber: allocation.room.roomNumber,
      bedNumber: allocation.bedNumber,
      checkIn: allocation.checkIn,
      checkOut: allocation.checkOut || '',
      status: allocation.status,
    }));
  }
}
