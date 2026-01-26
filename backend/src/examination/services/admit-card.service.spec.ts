
import { Test, TestingModule } from '@nestjs/testing';
import { AdmitCardService } from './admit-card.service';
import { PrismaService } from '../../prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrismaService = {
    exam: {
        findUnique: jest.fn(),
    },
    studentDetails: {
        findUnique: jest.fn(),
    },
    printSettings: {
        findFirst: jest.fn(),
    },
    examSchedule: {
        findMany: jest.fn(),
    },
};

describe('AdmitCardService', () => {
    let service: AdmitCardService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdmitCardService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<AdmitCardService>(AdmitCardService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateAdmitCard', () => {
        it('should generate structured admit card data correctly', async () => {
            // Mocks
            const mockExam = {
                id: 1,
                name: 'Final Exam',
                examType: { name: 'Annual' },
                session: { name: '2024-2025' },
            };
            const mockStudent = {
                studentId: 'STU123',
                name: 'John Doe',
                fatherName: 'Papa Doe',
                motherName: 'Mama Doe',
                className: 'X',
                section: 'A',
                rollNumber: '101',
            };
            const mockSettings = {
                schoolName: 'Test School',
                schoolAddress: 'Test Address',
            };
            // Schedules: Morning and Afternoon mixed
            const mockSchedules = [
                {
                    date: new Date('2025-03-01T00:00:00Z'),
                    startTime: new Date('2025-03-01T09:00:00Z'), // Morning
                    endTime: new Date('2025-03-01T11:30:00Z'),
                    subject: { name: 'Math' },
                    roomNo: '101',
                },
                {
                    date: new Date('2025-03-01T00:00:00Z'),
                    startTime: new Date('2025-03-01T14:00:00Z'), // Afternoon same day
                    endTime: new Date('2025-03-01T16:00:00Z'),
                    subject: { name: 'History' },
                    roomNo: '101',
                },
                {
                    date: new Date('2025-03-02T00:00:00Z'),
                    startTime: new Date('2025-03-02T09:00:00Z'), // Morning next day
                    endTime: new Date('2025-03-02T11:30:00Z'),
                    subject: { name: 'Science' },
                    roomNo: '102',
                },
            ];

            mockPrismaService.exam.findUnique.mockResolvedValue(mockExam);
            mockPrismaService.studentDetails.findUnique.mockResolvedValue(mockStudent);
            mockPrismaService.printSettings.findFirst.mockResolvedValue(mockSettings);
            mockPrismaService.examSchedule.findMany.mockResolvedValue(mockSchedules);

            // Execute
            const result = await service.generateAdmitCard(1, 'STU123');

            // Verify Header
            expect(result.header.schoolName).toBe('Test School');
            expect(result.header.examName).toBe('Final Exam');

            // Verify Student
            expect(result.student.name).toBe('John Doe');
            expect(result.student.examRollNo).toBe('101'); // Mapped to Class Roll No

            // Verify Schedule Grouping
            expect(result.schedule).toHaveLength(2); // 2 unique dates

            // Day 1: Math (Morning), History (Afternoon)
            const day1 = result.schedule.find(s => s.date === '2025-03-01');
            expect(day1).toBeDefined();
            expect(day1.firstSitting).toBe('Math');
            expect(day1.secondSitting).toBe('History');

            // Day 2: Science (Morning), Empty (Afternoon)
            const day2 = result.schedule.find(s => s.date === '2025-03-02');
            expect(day2).toBeDefined();
            expect(day2.firstSitting).toBe('Science');
            expect(day2.secondSitting).toBe('********');
        });

        it('should throw NotFoundException if student not found', async () => {
            mockPrismaService.exam.findUnique.mockResolvedValue({});
            mockPrismaService.studentDetails.findUnique.mockResolvedValue(null);
            await expect(service.generateAdmitCard(1, 'INVALID')).rejects.toThrow(NotFoundException);
        });
    });
});
