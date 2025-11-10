import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportType, ExportFormat } from './dto/generate-report.dto';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    student: {
      findMany: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
    },
    exam: {
      findMany: jest.fn(),
    },
    staff: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReport', () => {
    it('should generate a CSV report for students', async () => {
      const mockStudents = [
        {
          admissionNo: 'STU001',
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '1234567890',
          },
          section: {
            name: 'A',
            class: {
              name: 'Grade 1',
              gradeLevel: 1,
            },
          },
          status: 'active',
          admissionDate: new Date('2024-01-01'),
          gender: 'Male',
          bloodGroup: 'O+',
        },
      ];

      mockPrismaService.student.findMany.mockResolvedValue(mockStudents);

      const result = await service.generateReport('tenant1', {
        type: ReportType.STUDENTS,
        format: ExportFormat.CSV,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('contentType');
      expect(result.contentType).toBe('text/csv');
      expect(result.filename).toContain('students-report');
      expect(result.filename).toContain('.csv');
    });

    it('should generate a PDF report for students', async () => {
      const mockStudents = [
        {
          admissionNo: 'STU001',
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '1234567890',
          },
          section: {
            name: 'A',
            class: {
              name: 'Grade 1',
              gradeLevel: 1,
            },
          },
          status: 'active',
          admissionDate: new Date('2024-01-01'),
          gender: 'Male',
          bloodGroup: 'O+',
        },
      ];

      mockPrismaService.student.findMany.mockResolvedValue(mockStudents);

      const result = await service.generateReport('tenant1', {
        type: ReportType.STUDENTS,
        format: ExportFormat.PDF,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('contentType');
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toContain('students-report');
      expect(result.filename).toContain('.pdf');
    });

    it('should apply filters when generating student reports', async () => {
      const mockStudents = [
        {
          admissionNo: 'STU001',
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '1234567890',
          },
          section: {
            name: 'A',
            class: {
              name: 'Grade 1',
              gradeLevel: 1,
            },
          },
          status: 'active',
          admissionDate: new Date('2024-01-01'),
          gender: 'Male',
          bloodGroup: 'O+',
        },
      ];

      mockPrismaService.student.findMany.mockResolvedValue(mockStudents);

      await service.generateReport('tenant1', {
        type: ReportType.STUDENTS,
        format: ExportFormat.CSV,
        sectionId: 'section1',
        status: 'active',
      });

      expect(mockPrismaService.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant1',
            sectionId: 'section1',
            status: 'active',
          }),
        })
      );
    });

    it('should generate attendance report', async () => {
      const mockAttendances = [
        {
          date: new Date('2024-01-01'),
          section: {
            name: 'A',
            class: {
              name: 'Grade 1',
            },
          },
          entries: [
            {
              student: {
                admissionNo: 'STU001',
                user: {
                  firstName: 'John',
                  lastName: 'Doe',
                },
              },
              status: 'P',
              note: '',
            },
          ],
        },
      ];

      mockPrismaService.attendance.findMany.mockResolvedValue(mockAttendances);

      const result = await service.generateReport('tenant1', {
        type: ReportType.ATTENDANCE,
        format: ExportFormat.CSV,
      });

      expect(result).toHaveProperty('data');
      expect(result.contentType).toBe('text/csv');
    });

    it('should throw error for unsupported format', async () => {
      mockPrismaService.student.findMany.mockResolvedValue([]);

      await expect(
        service.generateReport('tenant1', {
          type: ReportType.STUDENTS,
          format: 'xml' as any,
        })
      ).rejects.toThrow('Unsupported format');
    });
  });

  describe('getReportTypes', () => {
    it('should return all available report types', async () => {
      const types = await service.getReportTypes();
      
      expect(types).toContain('students');
      expect(types).toContain('attendance');
      expect(types).toContain('fees');
      expect(types).toContain('exams');
      expect(types).toContain('staff');
    });
  });
});
