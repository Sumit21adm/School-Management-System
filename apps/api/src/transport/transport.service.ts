import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransportService {
  constructor(private prisma: PrismaService) {}

  // ============ Routes ============
  async findAllRoutes(tenantId: string) {
    return this.prisma.transportRoute.findMany({
      where: { tenantId },
      include: {
        stops: {
          orderBy: {
            sequence: 'asc',
          },
        },
        allocations: {
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
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findRouteById(id: string, tenantId: string) {
    return this.prisma.transportRoute.findFirst({
      where: { id, tenantId },
      include: {
        stops: {
          orderBy: {
            sequence: 'asc',
          },
        },
        allocations: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
            vehicle: true,
          },
        },
      },
    });
  }

  async createRoute(tenantId: string, data: any) {
    return this.prisma.transportRoute.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
      },
    });
  }

  async updateRoute(id: string, tenantId: string, data: any) {
    return this.prisma.transportRoute.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async deleteRoute(id: string, tenantId: string) {
    return this.prisma.transportRoute.deleteMany({
      where: { id, tenantId },
    });
  }

  // ============ Stops ============
  async findStopsByRoute(routeId: string) {
    return this.prisma.transportStop.findMany({
      where: { routeId },
      orderBy: {
        sequence: 'asc',
      },
    });
  }

  async createStop(data: any) {
    return this.prisma.transportStop.create({
      data,
    });
  }

  async updateStop(id: string, data: any) {
    return this.prisma.transportStop.update({
      where: { id },
      data,
    });
  }

  async deleteStop(id: string) {
    return this.prisma.transportStop.delete({
      where: { id },
    });
  }

  // ============ Vehicles ============
  async findAllVehicles(tenantId: string, filters?: { status?: string }) {
    return this.prisma.transportVehicle.findMany({
      where: {
        tenantId,
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        allocations: {
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
      },
      orderBy: {
        vehicleNumber: 'asc',
      },
    });
  }

  async findVehicleById(id: string, tenantId: string) {
    return this.prisma.transportVehicle.findFirst({
      where: { id, tenantId },
      include: {
        allocations: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
            route: true,
          },
        },
      },
    });
  }

  async createVehicle(tenantId: string, data: any) {
    return this.prisma.transportVehicle.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  async updateVehicle(id: string, tenantId: string, data: any) {
    return this.prisma.transportVehicle.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async deleteVehicle(id: string, tenantId: string) {
    return this.prisma.transportVehicle.deleteMany({
      where: { id, tenantId },
    });
  }

  // ============ Allocations ============
  async findAllAllocations(tenantId: string, filters?: { routeId?: string; vehicleId?: string; status?: string }) {
    return this.prisma.transportAllocation.findMany({
      where: {
        tenantId,
        ...(filters?.routeId && { routeId: filters.routeId }),
        ...(filters?.vehicleId && { vehicleId: filters.vehicleId }),
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
        route: true,
        vehicle: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createAllocation(tenantId: string, data: any) {
    return this.prisma.transportAllocation.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  async updateAllocation(id: string, tenantId: string, data: any) {
    return this.prisma.transportAllocation.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async deleteAllocation(id: string, tenantId: string) {
    return this.prisma.transportAllocation.deleteMany({
      where: { id, tenantId },
    });
  }

  // ============ Statistics ============
  async getStats(tenantId: string) {
    const totalRoutes = await this.prisma.transportRoute.count({
      where: { tenantId },
    });

    const totalVehicles = await this.prisma.transportVehicle.count({
      where: { tenantId, status: 'active' },
    });

    const totalAllocations = await this.prisma.transportAllocation.count({
      where: { tenantId, status: 'active' },
    });

    return {
      totalRoutes,
      totalVehicles,
      totalAllocations,
    };
  }

  // ============ CSV Export ============
  async exportRoutesCSV(tenantId: string) {
    const routes = await this.findAllRoutes(tenantId);
    return routes.map((route: any) => ({
      id: route.id,
      name: route.name,
      description: route.description,
      stopsCount: route.stops.length,
      allocationsCount: route.allocations.length,
    }));
  }

  async exportVehiclesCSV(tenantId: string) {
    const vehicles = await this.findAllVehicles(tenantId);
    return vehicles.map((vehicle: any) => ({
      id: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      type: vehicle.type,
      capacity: vehicle.capacity,
      driver: vehicle.driver,
      phone: vehicle.phone,
      status: vehicle.status,
      allocationsCount: vehicle.allocations.length,
    }));
  }

  async exportAllocationsCSV(tenantId: string) {
    const allocations = await this.findAllAllocations(tenantId);
    return allocations.map((allocation: any) => ({
      id: allocation.id,
      studentName: `${allocation.student.user.firstName} ${allocation.student.user.lastName}`,
      studentEmail: allocation.student.user.email,
      routeName: allocation.route.name,
      vehicleNumber: allocation.vehicle.vehicleNumber,
      stopName: allocation.stopName,
      status: allocation.status,
    }));
  }
}
