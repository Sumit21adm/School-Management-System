import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, recordedBy: string, dto: CreateAttendanceDto) {
    // Check if attendance already exists for this date and section
    const existing = await this.prisma.attendance.findFirst({
      where: {
        tenantId,
        date: new Date(dto.date),
        sectionId: dto.sectionId,
        type: 'student',
      },
    });

    if (existing) {
      throw new BadRequestException('Attendance already recorded for this date and section');
    }

    // Create attendance record with entries
    return this.prisma.attendance.create({
      data: {
        tenantId,
        date: new Date(dto.date),
        type: 'student',
        sectionId: dto.sectionId,
        recordedBy,
        entries: {
          create: dto.entries.map(entry => ({
            studentId: entry.studentId,
            status: entry.status,
            note: entry.note,
          })),
        },
      },
      include: {
        entries: {
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
        section: {
          include: {
            class: true,
          },
        },
      },
    });
  }

  async findAll(tenantId: string, query: QueryAttendanceDto) {
    const where: any = {
      tenantId,
      type: query.type || 'student',
    };

    if (query.sectionId) {
      where.sectionId = query.sectionId;
    }

    if (query.fromDate || query.toDate) {
      where.date = {};
      if (query.fromDate) {
        where.date.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.date.lte = new Date(query.toDate);
      }
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        section: {
          include: {
            class: true,
          },
        },
        staff: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        entries: {
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
        date: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const attendance = await this.prisma.attendance.findFirst({
      where: { id, tenantId },
      include: {
        section: {
          include: {
            class: true,
          },
        },
        staff: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        entries: {
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
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    return attendance;
  }

  async getSectionReport(tenantId: string, sectionId: string, fromDate?: string, toDate?: string) {
    const where: any = {
      tenantId,
      sectionId,
      type: 'student',
    };

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) where.date.lte = new Date(toDate);
    }

    const attendanceRecords = await this.prisma.attendance.findMany({
      where,
      include: {
        entries: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Aggregate stats
    const stats = {
      totalDays: attendanceRecords.length,
      students: new Map(),
    };

    attendanceRecords.forEach((record: any) => {
      record.entries.forEach((entry: any) => {
        if (!stats.students.has(entry.studentId)) {
          stats.students.set(entry.studentId, {
            student: entry.student,
            present: 0,
            absent: 0,
            leave: 0,
            holiday: 0,
          });
        }
        const studentStats = stats.students.get(entry.studentId);
        if (entry.status === 'P') studentStats.present++;
        else if (entry.status === 'A') studentStats.absent++;
        else if (entry.status === 'L') studentStats.leave++;
        else if (entry.status === 'H') studentStats.holiday++;
      });
    });

    return {
      sectionId,
      totalDays: stats.totalDays,
      students: Array.from(stats.students.values()).map(s => ({
        ...s,
        attendancePercentage: stats.totalDays > 0 ? ((s.present / stats.totalDays) * 100).toFixed(2) : 0,
      })),
      records: attendanceRecords,
    };
  }

  async getStudentReport(tenantId: string, studentId: string, fromDate?: string, toDate?: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
      include: {
        user: true,
        section: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const where: any = {
      attendanceId: {
        in: (await this.prisma.attendance.findMany({
          where: {
            tenantId,
            type: 'student',
            ...(fromDate || toDate ? {
              date: {
                ...(fromDate && { gte: new Date(fromDate) }),
                ...(toDate && { lte: new Date(toDate) }),
              },
            } : {}),
          },
          select: { id: true },
        })).map((a: any) => a.id),
      },
      studentId,
    };

    const entries = await this.prisma.attendanceEntry.findMany({
      where,
      include: {
        attendance: {
          select: {
            date: true,
          },
        },
      },
      orderBy: {
        attendance: {
          date: 'asc',
        },
      },
    });

    const stats = {
      present: entries.filter((e: any) => e.status === 'P').length,
      absent: entries.filter((e: any) => e.status === 'A').length,
      leave: entries.filter((e: any) => e.status === 'L').length,
      holiday: entries.filter((e: any) => e.status === 'H').length,
      total: entries.length,
    };

    return {
      student,
      stats: {
        ...stats,
        attendancePercentage: stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(2) : 0,
      },
      entries,
    };
  }

  async getClassReport(tenantId: string, classId: string, fromDate?: string, toDate?: string) {
    const sections = await this.prisma.section.findMany({
      where: { tenantId, classId },
      select: { id: true, name: true },
    });

    const reports = await Promise.all(
      sections.map((section: any) => this.getSectionReport(tenantId, section.id, fromDate, toDate))
    );

    return {
      classId,
      sections: reports,
    };
  }

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await this.prisma.attendance.findMany({
      where: {
        tenantId,
        type: 'student',
        date: today,
      },
      include: {
        entries: true,
      },
    });

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalStudents = 0;

    todayAttendance.forEach((record: any) => {
      record.entries.forEach((entry: any) => {
        totalStudents++;
        if (entry.status === 'P') totalPresent++;
        else if (entry.status === 'A') totalAbsent++;
      });
    });

    // Get weekly trend
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyAttendance = await this.prisma.attendance.findMany({
      where: {
        tenantId,
        type: 'student',
        date: {
          gte: weekAgo,
          lte: today,
        },
      },
      include: {
        entries: true,
      },
    });

    const dailyStats = new Map();
    weeklyAttendance.forEach((record: any) => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!dailyStats.has(dateStr)) {
        dailyStats.set(dateStr, { present: 0, total: 0 });
      }
      const stats = dailyStats.get(dateStr);
      record.entries.forEach((entry: any) => {
        stats.total++;
        if (entry.status === 'P') stats.present++;
      });
    });

    const weeklyTrend = Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      attendancePercentage: stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(2) : 0,
    }));

    return {
      today: {
        totalStudents,
        present: totalPresent,
        absent: totalAbsent,
        attendancePercentage: totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(2) : 0,
      },
      weeklyTrend,
    };
  }
}
