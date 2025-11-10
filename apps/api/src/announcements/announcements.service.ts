import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { QueryAnnouncementDto } from './dto/query-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createdBy: string, dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        tenantId,
        title: dto.title,
        body: dto.body,
        audience: JSON.parse(dto.audience),
        publishAt: new Date(dto.publishAt),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy,
      },
    });
  }

  async findAll(tenantId: string, query: QueryAnnouncementDto) {
    const where: any = {
      tenantId,
    };

    if (query.fromDate || query.toDate) {
      where.publishAt = {};
      if (query.fromDate) {
        where.publishAt.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.publishAt.lte = new Date(query.toDate);
      }
    }

    return this.prisma.announcement.findMany({
      where,
      orderBy: {
        publishAt: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, tenantId },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return announcement;
  }

  async update(id: string, tenantId: string, dto: UpdateAnnouncementDto) {
    const announcement = await this.findOne(id, tenantId);

    return this.prisma.announcement.update({
      where: { id: announcement.id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.body && { body: dto.body }),
        ...(dto.audience && { audience: JSON.parse(dto.audience) }),
        ...(dto.publishAt && { publishAt: new Date(dto.publishAt) }),
        ...(dto.expiresAt && { expiresAt: new Date(dto.expiresAt) }),
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const announcement = await this.findOne(id, tenantId);

    await this.prisma.announcement.delete({
      where: { id: announcement.id },
    });

    return { message: 'Announcement deleted successfully' };
  }

  async findMyAnnouncements(tenantId: string, userId: string) {
    // Get user details to determine their roles/classes/sections
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: {
        student: {
          include: {
            section: {
              include: {
                class: true,
              },
            },
          },
        },
        guardian: {
          include: {
            students: {
              include: {
                student: {
                  include: {
                    section: {
                      include: {
                        class: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        staff: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get all announcements and filter based on audience criteria
    const now = new Date();
    const allAnnouncements = await this.prisma.announcement.findMany({
      where: {
        tenantId,
        publishAt: { lte: now },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
      orderBy: {
        publishAt: 'desc',
      },
    });

    // Filter announcements based on user's profile and audience criteria
    const relevantAnnouncements = allAnnouncements.filter((announcement: any) => {
      const audience = announcement.audience as any;
      
      // If audience is "all", include this announcement
      if (audience.type === 'all') return true;

      // Check for specific audience types
      if (audience.type === 'student' && user.student) {
        if (!audience.classId && !audience.sectionId) return true;
        if (audience.classId && user.student.section?.classId === audience.classId) return true;
        if (audience.sectionId && user.student.sectionId === audience.sectionId) return true;
      }

      if (audience.type === 'parent' && user.guardian) {
        // Parents see announcements for their children's classes/sections
        return user.guardian.students.some((sg: any) => {
          const student = sg.student;
          if (!audience.classId && !audience.sectionId) return true;
          if (audience.classId && student.section?.classId === audience.classId) return true;
          if (audience.sectionId && student.sectionId === audience.sectionId) return true;
          return false;
        });
      }

      if (audience.type === 'teacher' && user.staff) {
        return true;
      }

      if (audience.type === 'staff' && user.staff) {
        return true;
      }

      return false;
    });

    return relevantAnnouncements;
  }

  async notifyAnnouncement(id: string, tenantId: string) {
    const announcement = await this.findOne(id, tenantId);
    
    // This is a stub for email/SMS integration
    // In production, this would integrate with services like SendGrid, Twilio, etc.
    
    const audience = announcement.audience as any;
    
    // Determine recipients based on audience criteria
    let recipients: any[] = [];
    
    if (audience.type === 'all') {
      // Get all users in the tenant
      recipients = await this.prisma.user.findMany({
        where: { tenantId },
        select: { email: true, phone: true, firstName: true, lastName: true },
      });
    } else if (audience.type === 'student') {
      const where: any = { tenantId, status: 'active' };
      if (audience.sectionId) where.sectionId = audience.sectionId;
      else if (audience.classId) {
        where.section = { classId: audience.classId };
      }
      
      const students = await this.prisma.student.findMany({
        where,
        include: {
          user: {
            select: { email: true, phone: true, firstName: true, lastName: true },
          },
        },
      });
      recipients = students.map((s: any) => s.user);
    } else if (audience.type === 'parent') {
      // Get guardians of students in the specified class/section
      const where: any = { tenantId, status: 'active' };
      if (audience.sectionId) where.sectionId = audience.sectionId;
      else if (audience.classId) {
        where.section = { classId: audience.classId };
      }
      
      const students = await this.prisma.student.findMany({
        where,
        include: {
          guardians: {
            include: {
              guardian: {
                include: {
                  user: {
                    select: { email: true, phone: true, firstName: true, lastName: true },
                  },
                },
              },
            },
          },
        },
      });
      
      const guardianSet = new Set();
      students.forEach((student: any) => {
        student.guardians.forEach((sg: any) => {
          guardianSet.add(JSON.stringify(sg.guardian.user));
        });
      });
      recipients = Array.from(guardianSet).map(g => JSON.parse(g as string));
    } else if (audience.type === 'teacher' || audience.type === 'staff') {
      const staff = await this.prisma.staff.findMany({
        where: { tenantId, status: 'active' },
        include: {
          user: {
            select: { email: true, phone: true, firstName: true, lastName: true },
          },
        },
      });
      recipients = staff.map((s: any) => s.user);
    }

    // Stub: Log the notification instead of actually sending
    console.log(`[NOTIFICATION STUB] Sending announcement "${announcement.title}" to ${recipients.length} recipients`);
    console.log(`Recipients:`, recipients.map(r => ({ email: r.email, phone: r.phone })));
    
    return {
      message: 'Notification sent successfully (stub)',
      recipientCount: recipients.length,
      channels: ['email', 'sms'],
      announcement: {
        id: announcement.id,
        title: announcement.title,
      },
    };
  }
}
