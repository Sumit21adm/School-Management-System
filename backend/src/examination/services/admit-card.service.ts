
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AdmitCardService {
    constructor(private prisma: PrismaService) { }

    async generateAdmitCard(examId: number, studentId: string) {
        // 1. Fetch Exam Details
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            include: { examType: true, session: true }
        });

        if (!exam) throw new NotFoundException('Exam not found');

        // 2. Fetch Student Details
        const student = await this.prisma.studentDetails.findUnique({
            where: { studentId: studentId },
            include: { session: true } // verify session matches if needed
        });

        if (!student) throw new NotFoundException('Student not found');

        // 3. Fetch Print Settings (School Header Info)
        const schoolSettings = await this.prisma.printSettings.findFirst();

        // 4. Fetch Exam Schedules for student's class
        const schedules = await this.prisma.examSchedule.findMany({
            where: {
                examId: examId,
                className: student.className // Filter by student's class
            },
            include: {
                subject: true
            },
            orderBy: { date: 'asc' }
        });

        // 5. Transform Schedules into "Sitting" format
        // Group by Date -> { date: "01-03-2025", firstSitting: "Science", secondSitting: "****" }
        const scheduleMap = new Map<string, { date: string, firstSitting: string, secondSitting: string }>();

        schedules.forEach(sch => {
            const dateKey = sch.date.toISOString().split('T')[0]; // YYYY-MM-DD

            if (!scheduleMap.has(dateKey)) {
                scheduleMap.set(dateKey, {
                    date: dateKey,
                    firstSitting: '********',
                    secondSitting: '********'
                });
            }

            const entry = scheduleMap.get(dateKey);

            // Determine sitting: Use period if available, otherwise infer from startTime
            let isMorning = true; // Default to morning/first sitting

            if (sch.period) {
                // Period-based: odd periods (1,3,5...) = morning, even (2,4,6...) = afternoon
                // Or simpler: period <= 4 is first sitting, > 4 is second
                isMorning = sch.period <= 4;
            } else if (sch.startTime) {
                // Time-based: check if before 12:00 PM
                const timeStr = sch.startTime.toISOString();
                isMorning = timeStr.includes('T08:') || timeStr.includes('T09:') ||
                    timeStr.includes('T10:') || timeStr.includes('T11:');
            }
            // If neither period nor startTime, default to firstSitting

            if (entry) {
                if (isMorning) {
                    entry.firstSitting = sch.subject.name;
                } else {
                    entry.secondSitting = sch.subject.name;
                }
            }
        });

        const formattedSchedule = Array.from(scheduleMap.values());

        // 6. Construct Final JSON Response
        return {
            header: {
                schoolName: schoolSettings?.schoolName || 'School Name',
                address: schoolSettings?.schoolAddress || 'Address',
                affiliationNo: schoolSettings?.affiliationNo || 'N/A',
                examName: exam.name,
                examType: exam.examType.name,
                session: exam.session.name,
                phone: schoolSettings?.phone || ''
            },
            student: {
                id: student.studentId,
                name: student.name,
                fatherName: student.fatherName,
                motherName: student.motherName,
                class: student.className,
                section: student.section,
                rollNo: student.rollNumber || 'N/A', // Class Roll No
                examRollNo: student.rollNumber || '0', // Mapped to Class Roll default per requirement
                roomNo: schedules.length > 0 ? schedules[0].roomNo || 'N/A' : 'N/A' // Taking room from first schedule or generic
            },
            schedule: formattedSchedule,
            footer: {
                instructions: schoolSettings?.admitCardNote?.split('\n') || [
                    "1. Entry is not permitted without admit card.",
                    "2. You should also carry articles related with exam.",
                    "3. Classes will be continued after and before examination."
                ],
                controllerSignLabel: "Exam Controller"
            }
        };
    }
}
