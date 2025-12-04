import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';

@Injectable()
export class SessionsService {
    constructor(private prisma: PrismaService) { }

    async findAll(includeInactive: boolean = true) {
        const sessions = await this.prisma.academicSession.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: { startDate: 'desc' },
        });

        return { sessions };
    }

    async findActive() {
        const session = await this.prisma.academicSession.findFirst({
            where: { isActive: true },
        });

        if (!session) {
            throw new NotFoundException('No active session found');
        }

        return session;
    }

    async findOne(id: number) {
        const session = await this.prisma.academicSession.findUnique({
            where: { id },
        });

        if (!session) {
            throw new NotFoundException(`Session with ID ${id} not found`);
        }

        return session;
    }

    async create(createSessionDto: CreateSessionDto) {
        // Check if session name already exists
        const existing = await this.prisma.academicSession.findUnique({
            where: { name: createSessionDto.name },
        });

        if (existing) {
            throw new ConflictException('Session with this name already exists');
        }

        // Validate dates
        const startDate = new Date(createSessionDto.startDate);
        const endDate = new Date(createSessionDto.endDate);

        if (endDate <= startDate) {
            throw new BadRequestException('End date must be after start date');
        }

        // Create session
        const session = await this.prisma.academicSession.create({
            data: {
                name: createSessionDto.name,
                startDate,
                endDate,
                isSetupMode: createSessionDto.isSetupMode ?? true,
                isActive: false, // Cannot be active on creation
            },
        });

        return session;
    }

    async update(id: number, updateSessionDto: UpdateSessionDto) {
        const session = await this.findOne(id);

        // If trying to update dates of active session, check if it has data
        if (session.isActive && (updateSessionDto.startDate || updateSessionDto.endDate)) {
            // This will be enhanced in Phase 5 to check for students/transactions
            // For now, allow updates
        }

        const updateData: any = {};

        if (updateSessionDto.name) updateData.name = updateSessionDto.name;
        if (updateSessionDto.startDate) updateData.startDate = new Date(updateSessionDto.startDate);
        if (updateSessionDto.endDate) updateData.endDate = new Date(updateSessionDto.endDate);
        if (updateSessionDto.isSetupMode !== undefined) updateData.isSetupMode = updateSessionDto.isSetupMode;

        const updated = await this.prisma.academicSession.update({
            where: { id },
            data: updateData,
        });

        return updated;
    }

    async activate(id: number) {
        const session = await this.findOne(id);

        // Deactivate currently active session
        await this.prisma.academicSession.updateMany({
            where: { isActive: true },
            data: { isActive: false },
        });

        // Activate target session
        const activated = await this.prisma.academicSession.update({
            where: { id },
            data: {
                isActive: true,
                isSetupMode: false, // Activated sessions are no longer in setup mode
            },
        });

        return {
            message: 'Session activated successfully',
            session: activated,
        };
    }

    async delete(id: number) {
        const session = await this.findOne(id);

        // Cannot delete active session
        if (session.isActive) {
            throw new BadRequestException('Cannot delete active session');
        }

        // Check if session has associated data (Phase 5)
        // For now, allow deletion
        // const studentCount = await this.prisma.studentDetails.count({
        //   where: { sessionId: id },
        // });
        // if (studentCount > 0) {
        //   throw new BadRequestException('Cannot delete session with student data');
        // }

        await this.prisma.academicSession.delete({
            where: { id },
        });

        return { message: 'Session deleted successfully' };
    }
}
