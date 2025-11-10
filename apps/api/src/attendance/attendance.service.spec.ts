import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prisma: PrismaService;

  const mockPrismaService = {
    attendance: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    student: {
      findFirst: jest.fn(),
    },
    section: {
      findMany: jest.fn(),
    },
    attendanceEntry: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create attendance record successfully', async () => {
      const tenantId = 'tenant1';
      const recordedBy = 'staff1';
      const dto = {
        date: '2024-11-10',
        sectionId: 'section1',
        entries: [
          { studentId: 'student1', status: 'P' as any },
          { studentId: 'student2', status: 'A' as any },
        ],
      };

      mockPrismaService.attendance.findFirst.mockResolvedValue(null);
      mockPrismaService.attendance.create.mockResolvedValue({
        id: 'attendance1',
        tenantId,
        date: new Date(dto.date),
        type: 'student',
        sectionId: dto.sectionId,
        recordedBy,
        entries: dto.entries,
      });

      const result = await service.create(tenantId, recordedBy, dto);

      expect(result).toBeDefined();
      expect(mockPrismaService.attendance.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId,
          date: new Date(dto.date),
          sectionId: dto.sectionId,
          type: 'student',
        },
      });
      expect(mockPrismaService.attendance.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if attendance already exists', async () => {
      const tenantId = 'tenant1';
      const recordedBy = 'staff1';
      const dto = {
        date: '2024-11-10',
        sectionId: 'section1',
        entries: [],
      };

      mockPrismaService.attendance.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(tenantId, recordedBy, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return attendance record by id', async () => {
      const id = 'attendance1';
      const tenantId = 'tenant1';
      const mockAttendance = {
        id,
        tenantId,
        date: new Date(),
        type: 'student',
      };

      mockPrismaService.attendance.findFirst.mockResolvedValue(mockAttendance);

      const result = await service.findOne(id, tenantId);

      expect(result).toEqual(mockAttendance);
      expect(mockPrismaService.attendance.findFirst).toHaveBeenCalledWith({
        where: { id, tenantId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if attendance not found', async () => {
      mockPrismaService.attendance.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'tenant1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return attendance statistics', async () => {
      const tenantId = 'tenant1';
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      mockPrismaService.attendance.findMany
        .mockResolvedValueOnce([
          {
            entries: [
              { status: 'P' },
              { status: 'P' },
              { status: 'A' },
            ],
          },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.getStats(tenantId);

      expect(result).toHaveProperty('today');
      expect(result).toHaveProperty('weeklyTrend');
      expect(result.today).toHaveProperty('totalStudents');
      expect(result.today).toHaveProperty('present');
      expect(result.today).toHaveProperty('absent');
      expect(result.today).toHaveProperty('attendancePercentage');
    });
  });
});
