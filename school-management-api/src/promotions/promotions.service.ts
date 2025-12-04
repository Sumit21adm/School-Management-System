import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PromoteStudentsDto } from './dto/promote-students.dto';

@Injectable()
export class PromotionsService {
    constructor(private prisma: PrismaService) { }

    async previewPromotion(params: {
        currentSessionId: number;
        className: string;
        section: string;
    }) {
        const students = await this.prisma.studentDetails.findMany({
            where: {
                sessionId: params.currentSessionId,
                className: params.className,
                section: params.section,
                status: { not: 'passed' }, // Exclude already passed students
            },
            orderBy: { studentId: 'asc' },
        });

        const eligible = students.filter((s) => s.status === 'active');
        const nextClass = this.calculateNextClass(params.className);
        const isPassoutClass = ['10', '12'].includes(params.className);

        return {
            students,
            meta: {
                total: students.length,
                eligible: eligible.length,
                ineligible: students.length - eligible.length,
                currentClass: params.className,
                nextClass,
                isPassoutClass,
            },
        };
    }

    async executePromotion(dto: PromoteStudentsDto) {
        const results = {
            success: true,
            promoted: 0,
            failed: 0,
            errors: [] as any[],
        };

        for (const studentId of dto.studentIds) {
            try {
                if (dto.markAsPassout) {
                    // Mark student as passed out
                    await this.prisma.studentDetails.update({
                        where: { id: studentId },
                        data: {
                            status: 'passed',
                        },
                    });
                } else {
                    // Promote to next class
                    await this.prisma.studentDetails.update({
                        where: { id: studentId },
                        data: {
                            className: dto.nextClass,
                            section: dto.nextSection,
                            sessionId: dto.nextSessionId,
                        },
                    });
                }
                results.promoted++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    studentId,
                    reason: error.message || 'Unknown error',
                });
            }
        }

        if (results.failed > 0) {
            results.success = false;
        }

        return results;
    }

    private calculateNextClass(currentClass: string): string | null {
        const classNum = parseInt(currentClass);
        if (classNum >= 1 && classNum < 12) {
            return (classNum + 1).toString();
        }
        return null; // Class 12 has no next class
    }
}
