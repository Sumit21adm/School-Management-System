
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class DummyExaminationDataService {
    private readonly logger = new Logger(DummyExaminationDataService.name);

    constructor(private prisma: PrismaService) { }

    async generateDummyData() {
        this.logger.log('Starting dummy data generation for Examinations...');

        // 1. Ensure Exam Type exists
        const examType = await this.prisma.examType.upsert({
            where: { name: 'Final Exam' },
            create: { name: 'Final Exam', description: 'End of session final examination' },
            update: {}
        });

        // 2. Ensure Subjects exist (from Reference Image)
        const subjectsList = [
            { name: 'SCIENCE', code: 'SCI' },
            { name: 'ENGLISH', code: 'ENG' },
            { name: 'HINDI', code: 'HIN' },
            { name: 'MATHS', code: 'MAT' },
            { name: 'S. SCIENCE', code: 'SST' }, // Social Science
            { name: 'COMPUTER', code: 'COMP' },
            { name: 'G.K+ DRAWING', code: 'GKDR' }
        ];

        const subjectMap = new Map<string, number>();

        for (const subj of subjectsList) {
            const subject = await this.prisma.subject.upsert({
                where: { name: subj.name },
                create: { name: subj.name, code: subj.code },
                update: {}
            });
            subjectMap.set(subj.name, subject.id);
        }

        // 3. Get Current Session (2024-2025)
        // Adjust logic to find the active session or fall back to a specific name
        const session = await this.prisma.academicSession.findFirst({
            where: { isActive: true }
        });

        if (!session) {
            this.logger.error('No active academic session found. Cannot schedule exams.');
            return { success: false, message: 'No active academic session found' };
        }

        // 4. Create Exam
        const examName = `Final Exam ${session.name}`;
        const startDate = new Date('2025-03-01T00:00:00Z'); // Derived from image first date
        const endDate = new Date('2025-03-12T00:00:00Z');   // Derived from image last date

        const exam = await this.prisma.exam.create({
            data: {
                name: examName,
                examTypeId: examType.id,
                sessionId: session.id,
                startDate: startDate,
                endDate: endDate,
                status: 'UPCOMING',
                description: 'Generated from Dummy Data Service'
            }
        });

        // 5. Create Exam Schedules (Matching Image)
        // First Sitting: 09:00 - 11:30
        // Second Sitting: 12:30 - 14:30
        const schedules = [
            // 01-03-2025: SCIENCE (1st)
            { date: '2025-03-01', subject: 'SCIENCE', sitting: 1 },
            // 03-03-2025: ENGLISH (1st)
            { date: '2025-03-03', subject: 'ENGLISH', sitting: 1 },
            // 05-03-2025: HINDI (1st)
            { date: '2025-03-05', subject: 'HINDI', sitting: 1 },
            // 07-03-2025: MATHS (1st)
            { date: '2025-03-07', subject: 'MATHS', sitting: 1 },
            // 10-03-2025: S. SCIENCE (1st)
            { date: '2025-03-10', subject: 'S. SCIENCE', sitting: 1 },
            // 12-03-2025: COMPUTER (1st), G.K+ DRAWING (2nd)
            { date: '2025-03-12', subject: 'COMPUTER', sitting: 1 },
            { date: '2025-03-12', subject: 'G.K+ DRAWING', sitting: 2 },
        ];

        // Target Classes: For now, let's schedule for Class "II" as per image, or all primary classes?
        // Let's target Class "II" specifically to match the image exact scenario first.
        const targetClass = "II";

        for (const item of schedules) {
            const subjectId = subjectMap.get(item.subject);
            if (!subjectId) continue;

            const baseDate = item.date; // YYYY-MM-DD
            let startTime, endTime;

            if (item.sitting === 1) {
                // 9:00 AM to 11:30 AM
                startTime = new Date(`${baseDate}T09:00:00`);
                endTime = new Date(`${baseDate}T11:30:00`);
            } else {
                // 12:30 PM to 02:30 PM
                startTime = new Date(`${baseDate}T12:30:00`);
                endTime = new Date(`${baseDate}T14:30:00`);
            }

            // Create schedule
            await this.prisma.examSchedule.create({
                data: {
                    examId: exam.id,
                    subjectId: subjectId,
                    className: targetClass,
                    date: new Date(baseDate),
                    startTime: startTime,
                    endTime: endTime,
                    period: item.sitting // Using 'period' field to store sitting number conceptually if needed, or just rely on time
                }
            });
        }

        this.logger.log(`Dummy Data Generated: Exam "${examName}" with schedules for Class ${targetClass}`);
        return {
            success: true,
            message: `Generated Exam: ${examName} for Class ${targetClass}`,
            examId: exam.id
        };
    }
}
