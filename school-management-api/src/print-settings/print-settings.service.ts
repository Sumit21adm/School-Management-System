import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdatePrintSettingsDto } from './dto/print-settings.dto';

@Injectable()
export class PrintSettingsService {
    constructor(private prisma: PrismaService) { }

    async get() {
        // Get first (and only) settings record, or return defaults
        const settings = await this.prisma.printSettings.findFirst();

        if (!settings) {
            // Return default values if no settings exist
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

    async update(updateDto: UpdatePrintSettingsDto) {
        const existing = await this.prisma.printSettings.findFirst();

        if (existing) {
            // Update existing record
            return this.prisma.printSettings.update({
                where: { id: existing.id },
                data: updateDto,
            });
        } else {
            // Create new record
            return this.prisma.printSettings.create({
                data: updateDto,
            });
        }
    }

    async updateLogoUrl(logoUrl: string) {
        const existing = await this.prisma.printSettings.findFirst();

        if (existing) {
            return this.prisma.printSettings.update({
                where: { id: existing.id },
                data: { logoUrl },
            });
        } else {
            // Create minimal record with logo
            return this.prisma.printSettings.create({
                data: {
                    schoolName: 'School Name',
                    schoolAddress: 'School Address',
                    logoUrl,
                },
            });
        }
    }
}
