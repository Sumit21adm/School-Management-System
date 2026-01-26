import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateModelAttendanceDto, MarkAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
    constructor(private prisma: PrismaService) { }

    async markAttendance(dto: MarkAttendanceDto, userId: number, sessionId: number) {
        // Upsert attendance record
        return this.prisma.attendance.upsert({
            where: {
                studentId_date_sessionId: {
                    studentId: dto.studentId,
                    date: new Date(dto.date),
                    sessionId
                }
            },
            update: {
                status: dto.status,
                inTime: dto.inTime,
                outTime: dto.outTime,
                remarks: dto.remarks,
                markedBy: userId,
            },
            create: {
                studentId: dto.studentId,
                date: new Date(dto.date),
                sessionId,
                status: dto.status,
                inTime: dto.inTime,
                outTime: dto.outTime,
                remarks: dto.remarks,
                markedBy: userId
            }
        });
    }

    async bulkMarkAttendance(dto: CreateModelAttendanceDto, userId: number) {
        const date = new Date(dto.date);
        const results: any[] = [];

        // Note: upsert in loop is okay for moderate class sizes (30-60). 
        // For massive bulk, createMany is better but doesn't handle updates easily in Prisma yet without native SQL.
        for (const item of dto.items) {
            const record = await this.prisma.attendance.upsert({
                where: {
                    studentId_date_sessionId: {
                        studentId: item.studentId,
                        date: date,
                        sessionId: dto.sessionId
                    }
                },
                update: {
                    status: item.status,
                    remarks: item.remarks,
                    markedBy: userId
                },
                create: {
                    studentId: item.studentId,
                    date: date,
                    sessionId: dto.sessionId,
                    status: item.status,
                    remarks: item.remarks,
                    markedBy: userId
                }
            });
            results.push(record);
        }
        return { count: results.length, message: 'Attendance marked successfully' };
    }

    async getDailyAttendance(date: string, sessionId: number, className?: string, section?: string) {
        const queryDate = new Date(date);

        // Handle className: it could be short name ("I") or display name ("Class I")
        // We need to check both formats since students might be stored with either
        let classSearchCondition: any = {};
        if (className) {
            // First, try to find the class to get both name and displayName
            const classInfo = await this.prisma.schoolClass.findFirst({
                where: {
                    OR: [
                        { name: className },
                        { displayName: className }
                    ]
                }
            });

            if (classInfo) {
                // Search for students with either the short name or display name
                classSearchCondition = {
                    OR: [
                        { className: classInfo.name },
                        { className: classInfo.displayName }
                    ]
                };
            } else {
                // Fallback: just search by the provided className
                classSearchCondition = { className };
            }
        }

        // 1. Get all students for the class/section
        const students = await this.prisma.studentDetails.findMany({
            where: {
                sessionId,
                ...classSearchCondition,
                ...(section && { section }),
                status: 'active'
            },
            select: {
                studentId: true,
                name: true,
                rollNumber: true,
                className: true,
                section: true,
                photoUrl: true // useful for UI
            },
            orderBy: { rollNumber: 'asc' }
        });

        // 2. Get attendance records for this date
        const attendanceRecords = await this.prisma.attendance.findMany({
            where: {
                sessionId,
                date: queryDate,
                studentId: { in: students.map(s => s.studentId) }
            }
        });

        // 3. Map records to students (Left Join logic)
        return students.map(student => {
            const record = attendanceRecords.find(r => r.studentId === student.studentId);
            return {
                ...student,
                attendance: record ? {
                    status: record.status,
                    remarks: record.remarks,
                    inTime: record.inTime
                } : null
            };
        });
    }

    async getStudentAttendanceHistory(studentId: string, sessionId: number, month?: number) {
        const where: any = {
            studentId,
            sessionId
        };

        if (month) {
            const year = new Date().getFullYear(); // Assuming current year for simplicity, but ideally should come from session or request
            // Logic to filter by month/year range would go here
        }

        return this.prisma.attendance.findMany({
            where,
            orderBy: { date: 'desc' }
        });
    }

    async getAttendanceSummary(sessionId: number, className: string, section: string, date: string) {
        const dailyData = await this.getDailyAttendance(date, sessionId, className, section);

        const total = dailyData.length;
        const present = dailyData.filter(d => d.attendance?.status === 'present').length;
        const absent = dailyData.filter(d => d.attendance?.status === 'absent').length;
        const late = dailyData.filter(d => d.attendance?.status === 'late').length;
        const leave = dailyData.filter(d => d.attendance?.status === 'leave').length;

        return {
            total,
            present,
            absent,
            late,
            leave,
            unmarked: total - (present + absent + late + leave)
        };
    }

    async getMonthlyReport(sessionId: number, month: number, year: number, className?: string, section?: string) {
        // Get date range for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month

        // Handle className: it could be short name ("I") or display name ("Class I")
        // We need to check both formats since students might be stored with either
        let classSearchCondition: any = {};
        if (className) {
            // First, try to find the class to get both name and displayName
            const classInfo = await this.prisma.schoolClass.findFirst({
                where: {
                    OR: [
                        { name: className },
                        { displayName: className }
                    ]
                }
            });

            if (classInfo) {
                // Search for students with either the short name or display name
                classSearchCondition = {
                    OR: [
                        { className: classInfo.name },
                        { className: classInfo.displayName }
                    ]
                };
            } else {
                // Fallback: just search by the provided className
                classSearchCondition = { className };
            }
        }

        // Get all students in the class/section
        const students = await this.prisma.studentDetails.findMany({
            where: {
                sessionId,
                ...classSearchCondition,
                ...(section && { section }),
                status: 'active'
            },
            select: {
                studentId: true,
                name: true,
                rollNumber: true,
                className: true,
                section: true
            }
        });

        // Get attendance records for the month
        const attendanceRecords = await this.prisma.attendance.findMany({
            where: {
                sessionId,
                date: {
                    gte: startDate,
                    lte: endDate
                },
                studentId: { in: students.map(s => s.studentId) }
            }
        });

        // Calculate stats for each student
        const studentsWithStats = students.map(student => {
            const records = attendanceRecords.filter(r => r.studentId === student.studentId);
            const totalDays = records.length;
            const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
            const absent = records.filter(r => r.status === 'absent').length;
            const late = records.filter(r => r.status === 'late').length;
            const percentage = totalDays > 0 ? (present / totalDays) * 100 : 0;

            return {
                ...student,
                stats: {
                    totalDays,
                    present,
                    absent,
                    late,
                    percentage: parseFloat(percentage.toFixed(2))
                }
            };
        });

        return {
            month,
            year,
            className,
            section,
            students: studentsWithStats,
            summary: {
                totalStudents: students.length,
                averageAttendance: studentsWithStats.reduce((sum, s) => sum + s.stats.percentage, 0) / students.length || 0
            }
        };
    }

    async getStudentSummary(studentId: string, sessionId: number, startDate?: string, endDate?: string) {
        const whereClause: any = {
            studentId,
            sessionId
        };

        if (startDate && endDate) {
            whereClause.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const records = await this.prisma.attendance.findMany({
            where: whereClause,
            orderBy: { date: 'desc' }
        });

        const totalDays = records.length;
        const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const late = records.filter(r => r.status === 'late').length;
        const leave = records.filter(r => r.status === 'leave').length;
        const percentage = totalDays > 0 ? (present / totalDays) * 100 : 0;

        return {
            studentId,
            totalDays,
            present,
            absent,
            late,
            leave,
            percentage: parseFloat(percentage.toFixed(2)),
            records: records.slice(0, 30) // Return last 30 days
        };
    }

    async getDefaulters(sessionId: number, threshold: number, className?: string, section?: string) {
        // Handle className: it could be short name ("I") or display name ("Class I")
        // We need to check both formats since students might be stored with either
        let classSearchCondition: any = {};
        if (className) {
            // First, try to find the class to get both name and displayName
            const classInfo = await this.prisma.schoolClass.findFirst({
                where: {
                    OR: [
                        { name: className },
                        { displayName: className }
                    ]
                }
            });

            if (classInfo) {
                // Search for students with either the short name or display name
                classSearchCondition = {
                    OR: [
                        { className: classInfo.name },
                        { className: classInfo.displayName }
                    ]
                };
            } else {
                // Fallback: just search by the provided className
                classSearchCondition = { className };
            }
        }

        // Get all students
        const students = await this.prisma.studentDetails.findMany({
            where: {
                sessionId,
                ...classSearchCondition,
                ...(section && { section }),
                status: 'active'
            }
        });

        // Get all attendance records for current month
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        const attendanceRecords = await this.prisma.attendance.findMany({
            where: {
                sessionId,
                date: { gte: startOfMonth },
                studentId: { in: students.map(s => s.studentId) }
            }
        });

        // Calculate attendance percentage for each student
        const defaulters = students
            .map(student => {
                const records = attendanceRecords.filter(r => r.studentId === student.studentId);
                const totalDays = records.length;
                const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
                const percentage = totalDays > 0 ? (present / totalDays) * 100 : 0;

                return {
                    studentId: student.studentId,
                    name: student.name,
                    rollNumber: student.rollNumber,
                    className: student.className,
                    section: student.section,
                    totalDays,
                    present,
                    absent: records.filter(r => r.status === 'absent').length,
                    percentage: parseFloat(percentage.toFixed(2))
                };
            })
            .filter(s => s.percentage < threshold && s.totalDays > 0) // Only include if they have attendance records
            .sort((a, b) => a.percentage - b.percentage);

        return {
            threshold,
            count: defaulters.length,
            students: defaulters
        };
    }
}
