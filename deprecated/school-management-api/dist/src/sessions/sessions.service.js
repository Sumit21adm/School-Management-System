"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let SessionsService = class SessionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(includeInactive = true) {
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
            throw new common_1.NotFoundException('No active session found');
        }
        return session;
    }
    async findOne(id) {
        const session = await this.prisma.academicSession.findUnique({
            where: { id },
        });
        if (!session) {
            throw new common_1.NotFoundException(`Session with ID ${id} not found`);
        }
        return session;
    }
    async create(createSessionDto) {
        const existing = await this.prisma.academicSession.findUnique({
            where: { name: createSessionDto.name },
        });
        if (existing) {
            throw new common_1.ConflictException('Session with this name already exists');
        }
        const startDate = new Date(createSessionDto.startDate);
        const endDate = new Date(createSessionDto.endDate);
        if (endDate <= startDate) {
            throw new common_1.BadRequestException('End date must be after start date');
        }
        const session = await this.prisma.academicSession.create({
            data: {
                name: createSessionDto.name,
                startDate,
                endDate,
                isSetupMode: createSessionDto.isSetupMode ?? true,
                isActive: false,
            },
        });
        return session;
    }
    async update(id, updateSessionDto) {
        const session = await this.findOne(id);
        if (session.isActive && (updateSessionDto.startDate || updateSessionDto.endDate)) {
        }
        const updateData = {};
        if (updateSessionDto.name)
            updateData.name = updateSessionDto.name;
        if (updateSessionDto.startDate)
            updateData.startDate = new Date(updateSessionDto.startDate);
        if (updateSessionDto.endDate)
            updateData.endDate = new Date(updateSessionDto.endDate);
        if (updateSessionDto.isSetupMode !== undefined)
            updateData.isSetupMode = updateSessionDto.isSetupMode;
        const updated = await this.prisma.academicSession.update({
            where: { id },
            data: updateData,
        });
        return updated;
    }
    async activate(id) {
        const session = await this.findOne(id);
        await this.prisma.academicSession.updateMany({
            where: { isActive: true },
            data: { isActive: false },
        });
        const activated = await this.prisma.academicSession.update({
            where: { id },
            data: {
                isActive: true,
                isSetupMode: false,
            },
        });
        return {
            message: 'Session activated successfully',
            session: activated,
        };
    }
    async delete(id) {
        const session = await this.findOne(id);
        if (session.isActive) {
            throw new common_1.BadRequestException('Cannot delete active session');
        }
        await this.prisma.academicSession.delete({
            where: { id },
        });
        return { message: 'Session deleted successfully' };
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map