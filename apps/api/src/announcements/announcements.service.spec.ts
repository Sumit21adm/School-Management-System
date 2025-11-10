import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementsService } from './announcements.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    announcement: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    student: {
      findMany: jest.fn(),
    },
    staff: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnnouncementsService>(AnnouncementsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create announcement successfully', async () => {
      const tenantId = 'tenant1';
      const createdBy = 'user1';
      const dto = {
        title: 'Test Announcement',
        body: 'This is a test',
        audience: JSON.stringify({ type: 'all' }),
        publishAt: '2024-11-10T00:00:00Z',
      };

      const mockAnnouncement = {
        id: 'announcement1',
        tenantId,
        title: dto.title,
        body: dto.body,
        audience: { type: 'all' },
        publishAt: new Date(dto.publishAt),
        createdBy,
      };

      mockPrismaService.announcement.create.mockResolvedValue(mockAnnouncement);

      const result = await service.create(tenantId, createdBy, dto);

      expect(result).toEqual(mockAnnouncement);
      expect(mockPrismaService.announcement.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          title: dto.title,
          body: dto.body,
          audience: { type: 'all' },
          publishAt: new Date(dto.publishAt),
          expiresAt: null,
          createdBy,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all announcements', async () => {
      const tenantId = 'tenant1';
      const mockAnnouncements = [
        {
          id: 'announcement1',
          tenantId,
          title: 'Test 1',
          body: 'Body 1',
          audience: { type: 'all' },
          publishAt: new Date(),
        },
        {
          id: 'announcement2',
          tenantId,
          title: 'Test 2',
          body: 'Body 2',
          audience: { type: 'student' },
          publishAt: new Date(),
        },
      ];

      mockPrismaService.announcement.findMany.mockResolvedValue(mockAnnouncements);

      const result = await service.findAll(tenantId, {});

      expect(result).toEqual(mockAnnouncements);
      expect(mockPrismaService.announcement.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return announcement by id', async () => {
      const id = 'announcement1';
      const tenantId = 'tenant1';
      const mockAnnouncement = {
        id,
        tenantId,
        title: 'Test',
        body: 'Body',
        audience: { type: 'all' },
        publishAt: new Date(),
      };

      mockPrismaService.announcement.findFirst.mockResolvedValue(mockAnnouncement);

      const result = await service.findOne(id, tenantId);

      expect(result).toEqual(mockAnnouncement);
      expect(mockPrismaService.announcement.findFirst).toHaveBeenCalledWith({
        where: { id, tenantId },
      });
    });

    it('should throw NotFoundException if announcement not found', async () => {
      mockPrismaService.announcement.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'tenant1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update announcement', async () => {
      const id = 'announcement1';
      const tenantId = 'tenant1';
      const dto = {
        title: 'Updated Title',
      };

      const existingAnnouncement = {
        id,
        tenantId,
        title: 'Old Title',
        body: 'Body',
      };

      const updatedAnnouncement = {
        ...existingAnnouncement,
        title: dto.title,
      };

      mockPrismaService.announcement.findFirst.mockResolvedValue(existingAnnouncement);
      mockPrismaService.announcement.update.mockResolvedValue(updatedAnnouncement);

      const result = await service.update(id, tenantId, dto);

      expect(result).toEqual(updatedAnnouncement);
      expect(mockPrismaService.announcement.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete announcement', async () => {
      const id = 'announcement1';
      const tenantId = 'tenant1';

      mockPrismaService.announcement.findFirst.mockResolvedValue({ id, tenantId });
      mockPrismaService.announcement.delete.mockResolvedValue({});

      const result = await service.remove(id, tenantId);

      expect(result).toEqual({ message: 'Announcement deleted successfully' });
      expect(mockPrismaService.announcement.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('notifyAnnouncement', () => {
    it('should prepare notification for all users', async () => {
      const id = 'announcement1';
      const tenantId = 'tenant1';
      const mockAnnouncement = {
        id,
        tenantId,
        title: 'Test',
        body: 'Body',
        audience: { type: 'all' },
        publishAt: new Date(),
      };

      const mockUsers = [
        { email: 'user1@test.com', phone: '1234567890', firstName: 'User', lastName: 'One' },
        { email: 'user2@test.com', phone: '0987654321', firstName: 'User', lastName: 'Two' },
      ];

      mockPrismaService.announcement.findFirst.mockResolvedValue(mockAnnouncement);
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.notifyAnnouncement(id, tenantId);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('recipientCount', 2);
      expect(result).toHaveProperty('channels');
    });
  });
});
