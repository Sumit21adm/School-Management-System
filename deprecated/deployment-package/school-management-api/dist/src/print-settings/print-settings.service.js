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
exports.PrintSettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let PrintSettingsService = class PrintSettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async get() {
        const settings = await this.prisma.printSettings.findFirst();
        if (!settings) {
            return {
                id: null,
                schoolName: '',
                schoolAddress: '',
                phone: '',
                email: '',
                website: '',
                logoUrl: null,
                tagline: '',
            };
        }
        return settings;
    }
    async update(updateDto) {
        const existing = await this.prisma.printSettings.findFirst();
        if (existing) {
            return this.prisma.printSettings.update({
                where: { id: existing.id },
                data: updateDto,
            });
        }
        else {
            return this.prisma.printSettings.create({
                data: updateDto,
            });
        }
    }
    async updateLogoUrl(logoUrl) {
        const existing = await this.prisma.printSettings.findFirst();
        if (existing) {
            return this.prisma.printSettings.update({
                where: { id: existing.id },
                data: { logoUrl },
            });
        }
        else {
            return this.prisma.printSettings.create({
                data: {
                    schoolName: 'School Name',
                    schoolAddress: 'School Address',
                    logoUrl,
                },
            });
        }
    }
};
exports.PrintSettingsService = PrintSettingsService;
exports.PrintSettingsService = PrintSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrintSettingsService);
//# sourceMappingURL=print-settings.service.js.map