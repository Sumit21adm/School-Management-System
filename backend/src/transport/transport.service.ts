import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
// Driver DTOs removed
import { CreateRouteDto, UpdateRouteDto, CreateRouteStopDto, UpdateRouteStopDto } from './dto/route.dto';
import { AssignTransportDto, UpdateTransportAssignmentDto, BulkAssignTransportDto } from './dto/assignment.dto';

@Injectable()
export class TransportService {
    constructor(private prisma: PrismaService) { }

    // ============================================
    // SETTINGS OPERATIONS
    // ============================================

    async getSettings() {
        let settings = await this.prisma.transportSettings.findFirst();
        if (!settings) {
            settings = await this.prisma.transportSettings.create({
                data: { fareCalculationMode: 'DISTANCE_SLAB' }
            });
        }
        return settings;
    }

    async updateSettings(dto: { fareCalculationMode: string }) {
        const settings = await this.getSettings();
        return this.prisma.transportSettings.update({
            where: { id: settings.id },
            data: { fareCalculationMode: dto.fareCalculationMode }
        });
    }

    // ============================================
    // VEHICLE OPERATIONS
    // ============================================

    async findAllVehicles(status?: string) {
        return this.prisma.vehicle.findMany({
            where: status ? { status } : undefined,
            include: {
                driver: { select: { id: true, name: true, phone: true } },
                routes: {
                    select: { id: true, routeName: true, routeCode: true }
                }
            },
            orderBy: { vehicleNo: 'asc' }
        });
    }

    async findVehicleById(id: number) {
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id },
            include: {
                driver: { select: { id: true, name: true, phone: true } },
                routes: {
                    include: {
                        stops: { orderBy: { stopOrder: 'asc' } }
                    }
                }
            }
        });
        if (!vehicle) throw new NotFoundException('Vehicle not found');
        return vehicle;
    }

    async createVehicle(dto: CreateVehicleDto) {
        // Check for duplicate vehicle number
        const existing = await this.prisma.vehicle.findUnique({
            where: { vehicleNo: dto.vehicleNo }
        });
        if (existing) throw new ConflictException('Vehicle number already exists');

        return this.prisma.vehicle.create({
            data: {
                ...dto,
                insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null,
                fitnessExpiry: dto.fitnessExpiry ? new Date(dto.fitnessExpiry) : null,
                permitExpiry: dto.permitExpiry ? new Date(dto.permitExpiry) : null,
            },
            include: { driver: { select: { id: true, name: true, phone: true } } }
        });
    }

    async updateVehicle(id: number, dto: UpdateVehicleDto) {
        await this.findVehicleById(id);
        return this.prisma.vehicle.update({
            where: { id },
            data: {
                ...dto,
                insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : undefined,
                fitnessExpiry: dto.fitnessExpiry ? new Date(dto.fitnessExpiry) : undefined,
                permitExpiry: dto.permitExpiry ? new Date(dto.permitExpiry) : undefined,
            },
            include: { driver: { select: { id: true, name: true, phone: true } } }
        });
    }

    async deleteVehicle(id: number) {
        await this.findVehicleById(id);
        return this.prisma.vehicle.delete({ where: { id } });
    }

    // ============================================
    // DRIVER OPERATIONS (REMOVED - Use StaffService)
    // ============================================

    // Driver methods removed to use unified Staff/User model.


    // ============================================
    // ROUTE OPERATIONS
    // ============================================

    async findAllRoutes(status?: string) {
        return this.prisma.route.findMany({
            where: status ? { status } : undefined,
            include: {
                vehicle: { include: { driver: { select: { id: true, name: true, phone: true } } } },
                stops: { orderBy: { stopOrder: 'asc' } },
                _count: { select: { studentTransports: true } }
            },
            orderBy: { routeCode: 'asc' }
        });
    }

    async findRouteById(id: number) {
        const route = await this.prisma.route.findUnique({
            where: { id },
            include: {
                vehicle: { include: { driver: { select: { id: true, name: true, phone: true } } } },
                stops: { orderBy: { stopOrder: 'asc' } },
                studentTransports: {
                    include: {
                        student: { select: { studentId: true, name: true, className: true, section: true } },
                        pickupStop: true,
                        dropStop: true
                    }
                }
            }
        });
        if (!route) throw new NotFoundException('Route not found');
        return route;
    }

    async createRoute(dto: CreateRouteDto) {
        // Check for duplicate route code
        const existing = await this.prisma.route.findUnique({
            where: { routeCode: dto.routeCode }
        });
        if (existing) throw new ConflictException('Route code already exists');

        const { stops, ...routeData } = dto;

        return this.prisma.route.create({
            data: {
                ...routeData,
                stops: stops ? {
                    create: stops.map(stop => ({
                        ...stop,
                        latitude: stop.latitude ? stop.latitude : null,
                        longitude: stop.longitude ? stop.longitude : null,
                    }))
                } : undefined
            },
            include: {
                vehicle: true,
                stops: { orderBy: { stopOrder: 'asc' } }
            }
        });
    }

    async updateRoute(id: number, dto: UpdateRouteDto) {
        await this.findRouteById(id);
        return this.prisma.route.update({
            where: { id },
            data: dto,
            include: {
                vehicle: true,
                stops: { orderBy: { stopOrder: 'asc' } }
            }
        });
    }

    async deleteRoute(id: number) {
        await this.findRouteById(id);
        return this.prisma.route.delete({ where: { id } });
    }

    // ============================================
    // ROUTE STOP OPERATIONS
    // ============================================

    async addStopToRoute(routeId: number, dto: CreateRouteStopDto) {
        await this.findRouteById(routeId);
        return this.prisma.routeStop.create({
            data: {
                ...dto,
                routeId,
                latitude: dto.latitude ? dto.latitude : null,
                longitude: dto.longitude ? dto.longitude : null,
            }
        });
    }

    async updateStop(routeId: number, stopId: number, dto: UpdateRouteStopDto) {
        const stop = await this.prisma.routeStop.findFirst({
            where: { id: stopId, routeId }
        });
        if (!stop) throw new NotFoundException('Stop not found');

        return this.prisma.routeStop.update({
            where: { id: stopId },
            data: dto
        });
    }

    async deleteStop(routeId: number, stopId: number) {
        const stop = await this.prisma.routeStop.findFirst({
            where: { id: stopId, routeId }
        });
        if (!stop) throw new NotFoundException('Stop not found');

        return this.prisma.routeStop.delete({ where: { id: stopId } });
    }

    // ============================================
    // STUDENT TRANSPORT ASSIGNMENT
    // ============================================

    async findAllAssignments(routeId?: number, status?: string) {
        return this.prisma.studentTransport.findMany({
            where: {
                ...(routeId ? { routeId } : {}),
                ...(status ? { status } : {})
            },
            include: {
                student: { select: { studentId: true, name: true, className: true, section: true, phone: true } },
                route: { select: { id: true, routeName: true, routeCode: true } },
                pickupStop: true,
                dropStop: true
            },
            orderBy: { student: { name: 'asc' } }
        });
    }

    async findAssignmentByStudent(studentId: string) {
        const assignment = await this.prisma.studentTransport.findUnique({
            where: { studentId },
            include: {
                student: true,
                route: {
                    include: {
                        vehicle: { include: { driver: true } },
                        stops: { orderBy: { stopOrder: 'asc' } }
                    }
                },
                pickupStop: true,
                dropStop: true
            }
        });

        if (!assignment) return null;

        // Calculate Fee based on Fare Slabs
        // Calculate Fee based on Settings
        let calculatedFee = 0;

        // Fetch Settings
        const settings = await this.getSettings();

        // Check assigned stop
        const assignedStop = assignment.pickupStop || assignment.dropStop;
        if (assignedStop) {
            if (settings.fareCalculationMode === 'STOP_WISE') {
                calculatedFee = Number(assignedStop.fare || 0);
            } else {
                // DISTANCE_SLAB
                const distance = Number(assignedStop.distanceFromSchool || 0);
                if (distance > 0) {
                    const slab = await this.prisma.transportFareSlab.findFirst({
                        where: {
                            isActive: true,
                            minDistance: { lte: distance },
                            maxDistance: { gte: distance }
                        }
                    });
                    if (slab) {
                        calculatedFee = Number(slab.monthlyFee);
                    }
                }
            }
        }

        return { ...assignment, calculatedFee };
    }

    async assignTransport(dto: AssignTransportDto) {
        // Check if student exists
        const student = await this.prisma.studentDetails.findUnique({
            where: { studentId: dto.studentId }
        });
        if (!student) throw new NotFoundException('Student not found');

        // Check if already assigned
        const existing = await this.prisma.studentTransport.findUnique({
            where: { studentId: dto.studentId }
        });
        if (existing) throw new ConflictException('Student already has transport assigned');

        // Verify route exists
        await this.findRouteById(dto.routeId);

        return this.prisma.studentTransport.create({
            data: {
                studentId: dto.studentId,
                routeId: dto.routeId,
                pickupStopId: dto.pickupStopId,
                dropStopId: dto.dropStopId,
                transportType: dto.transportType || 'both',
                startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
                notes: dto.notes
            },
            include: {
                student: { select: { studentId: true, name: true, className: true } },
                route: { select: { routeName: true } },
                pickupStop: true,
                dropStop: true
            }
        });
    }

    async updateAssignment(id: number, dto: UpdateTransportAssignmentDto) {
        const assignment = await this.prisma.studentTransport.findUnique({ where: { id } });
        if (!assignment) throw new NotFoundException('Assignment not found');

        return this.prisma.studentTransport.update({
            where: { id },
            data: {
                ...dto,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            },
            include: {
                student: { select: { studentId: true, name: true, className: true } },
                route: { select: { routeName: true } },
                pickupStop: true,
                dropStop: true
            }
        });
    }

    async removeAssignment(id: number) {
        const assignment = await this.prisma.studentTransport.findUnique({ where: { id } });
        if (!assignment) throw new NotFoundException('Assignment not found');

        return this.prisma.studentTransport.delete({ where: { id } });
    }

    async bulkAssignTransport(dto: BulkAssignTransportDto) {
        // Verify route exists
        await this.findRouteById(dto.routeId);

        const results = { success: 0, failed: 0, errors: [] as string[] };

        for (const studentId of dto.studentIds) {
            try {
                // Check if student exists
                const student = await this.prisma.studentDetails.findUnique({
                    where: { studentId }
                });
                if (!student) {
                    results.errors.push(`Student ${studentId} not found`);
                    results.failed++;
                    continue;
                }

                // Check if already assigned
                const existing = await this.prisma.studentTransport.findUnique({
                    where: { studentId }
                });
                if (existing) {
                    results.errors.push(`Student ${studentId} already has transport`);
                    results.failed++;
                    continue;
                }

                await this.prisma.studentTransport.create({
                    data: {
                        studentId,
                        routeId: dto.routeId,
                        pickupStopId: dto.pickupStopId,
                        dropStopId: dto.dropStopId,
                        transportType: dto.transportType || 'both',
                        startDate: new Date(),
                    }
                });
                results.success++;
            } catch (error) {
                results.errors.push(`Error assigning ${studentId}: ${error.message}`);
                results.failed++;
            }
        }

        return results;
    }

    // ============================================
    // REPORTS
    // ============================================

    async getRouteWiseReport() {
        const [routes, slabs] = await Promise.all([
            this.prisma.route.findMany({
                where: { status: 'active' },
                include: {
                    vehicle: { include: { driver: true } },
                    stops: { orderBy: { stopOrder: 'asc' } },
                    studentTransports: {
                        where: { status: 'active' },
                        include: {
                            student: { select: { studentId: true, name: true, className: true, section: true, phone: true } },
                            pickupStop: true,
                            dropStop: true
                        }
                    }
                },
                orderBy: { routeCode: 'asc' }
            }),
            this.prisma.transportFareSlab.findMany({ where: { isActive: true } })
        ]);

        return routes.map(route => {
            let routeRevenue = 0;

            route.studentTransports.forEach(st => {
                let dist = 0;
                if (st.transportType === 'pickup' && st.pickupStop?.distanceFromSchool) {
                    dist = Number(st.pickupStop.distanceFromSchool);
                } else if (st.transportType === 'drop' && st.dropStop?.distanceFromSchool) {
                    dist = Number(st.dropStop.distanceFromSchool);
                } else {
                    const p = Number(st.pickupStop?.distanceFromSchool || 0);
                    const d = Number(st.dropStop?.distanceFromSchool || 0);
                    dist = Math.max(p, d);
                }

                if (dist > 0) {
                    const slab = slabs.find(s => dist >= Number(s.minDistance) && dist <= Number(s.maxDistance));
                    if (slab) routeRevenue += Number(slab.monthlyFee);
                }
            });

            return {
                ...route,
                studentCount: route.studentTransports.length,
                totalFee: routeRevenue
            };
        });
    }

    async getStopWiseReport(routeId: number) {
        const route = await this.findRouteById(routeId);

        const stopsWithStudents = route.stops.map(stop => {
            const pickupStudents = route.studentTransports.filter(
                t => t.pickupStopId === stop.id
            );
            const dropStudents = route.studentTransports.filter(
                t => t.dropStopId === stop.id
            );

            return {
                ...stop,
                pickupStudents: pickupStudents.map(t => t.student),
                dropStudents: dropStudents.map(t => t.student),
                pickupCount: pickupStudents.length,
                dropCount: dropStudents.length
            };
        });

        return {
            route: {
                id: route.id,
                routeName: route.routeName,
                routeCode: route.routeCode,
                vehicle: route.vehicle
            },
            stops: stopsWithStudents
        };
    }

    // ============================================
    // FARE SLAB OPERATIONS
    // ============================================

    async findAllFareSlabs(activeOnly?: boolean) {
        return this.prisma.transportFareSlab.findMany({
            where: activeOnly ? { isActive: true } : undefined,
            orderBy: { minDistance: 'asc' }
        });
    }

    async createFareSlab(dto: { minDistance: number; maxDistance: number; monthlyFee: number; description?: string; isActive?: boolean }) {
        // Check for overlapping slabs
        const overlapping = await this.prisma.transportFareSlab.findFirst({
            where: {
                isActive: true,
                OR: [
                    { minDistance: { lt: dto.maxDistance }, maxDistance: { gt: dto.minDistance } }
                ]
            }
        });
        if (overlapping) {
            throw new ConflictException(`Distance range overlaps with existing slab: ${overlapping.description || `${overlapping.minDistance}-${overlapping.maxDistance} km`}`);
        }

        return this.prisma.transportFareSlab.create({
            data: {
                minDistance: dto.minDistance,
                maxDistance: dto.maxDistance,
                monthlyFee: dto.monthlyFee,
                description: dto.description || `${dto.minDistance}-${dto.maxDistance} km`,
                isActive: dto.isActive ?? true
            }
        });
    }

    async updateFareSlab(id: number, dto: { minDistance?: number; maxDistance?: number; monthlyFee?: number; description?: string; isActive?: boolean }) {
        const slab = await this.prisma.transportFareSlab.findUnique({ where: { id } });
        if (!slab) throw new NotFoundException('Fare slab not found');

        // Check for overlapping if distance changed
        if (dto.minDistance !== undefined || dto.maxDistance !== undefined) {
            const minDist = dto.minDistance ?? Number(slab.minDistance);
            const maxDist = dto.maxDistance ?? Number(slab.maxDistance);
            const overlapping = await this.prisma.transportFareSlab.findFirst({
                where: {
                    id: { not: id },
                    isActive: true,
                    OR: [
                        { minDistance: { lt: maxDist }, maxDistance: { gt: minDist } }
                    ]
                }
            });
            if (overlapping) {
                throw new ConflictException(`Distance range overlaps with existing slab`);
            }
        }

        return this.prisma.transportFareSlab.update({
            where: { id },
            data: dto
        });
    }

    async deleteFareSlab(id: number) {
        const slab = await this.prisma.transportFareSlab.findUnique({ where: { id } });
        if (!slab) throw new NotFoundException('Fare slab not found');
        return this.prisma.transportFareSlab.delete({ where: { id } });
    }

    /**
     * Get fare for a given distance (used for fee calculation)
     */
    async getFareForDistance(distance: number): Promise<number> {
        const slab = await this.prisma.transportFareSlab.findFirst({
            where: {
                isActive: true,
                minDistance: { lte: distance },
                maxDistance: { gte: distance }
            }
        });
        return slab ? Number(slab.monthlyFee) : 0;
    }
}
