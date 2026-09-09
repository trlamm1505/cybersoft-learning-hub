import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { ContestService } from './contest.service';
import { Contest } from '../../modules-system/database/schemas/contest.schema';

describe('ContestService', () => {
  let service: ContestService;
  let mockContestModel: any;

  const mockContestObj = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Contest',
    slug: 'test-contest',
    startTime: new Date(Date.now() - 10 * 60 * 1000), // 10m ago
    endTime: new Date(Date.now() + 50 * 60 * 1000), // in 50m
    durationMinutes: 60,
    registrations: [{ studentId: 'student-1', studentName: 'Nguyen Van A', registeredAt: new Date() }],
    problems: [],
    status: 'published',
    toObject: function () {
      return { ...this };
    },
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockContestModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: '507f1f77bcf86cd799439011' }),
    }));

    mockContestModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockContestObj]),
      }),
    });

    mockContestModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockContestObj),
    });

    mockContestModel.findById = jest.fn().mockResolvedValue({
      ...mockContestObj,
      save: jest.fn().mockResolvedValue(mockContestObj),
    });

    mockContestModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockContestObj);
    mockContestModel.countDocuments = jest.fn().mockResolvedValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContestService,
        {
          provide: getModelToken(Contest.name),
          useValue: mockContestModel,
        },
      ],
    }).compile();

    service = module.get<ContestService>(ContestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createContest', () => {
    it('should throw BadRequestException if startTime >= endTime', async () => {
      const now = new Date();
      await expect(
        service.createContest({
          title: 'Invalid Time Contest',
          startTime: new Date(now.getTime() + 600000),
          endTime: now,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create contest successfully with valid times', async () => {
      mockContestModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const now = new Date();
      const result = await service.createContest({
        title: 'New Contest 2026',
        startTime: now,
        endTime: new Date(now.getTime() + 3600000),
      });

      expect(result).toBeDefined();
      expect(result.title).toBe('New Contest 2026');
    });
  });

  describe('registerContest', () => {
    it('should register a new student to ongoing contest', async () => {
      mockContestModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockContestObj,
          registrations: [],
          save: jest.fn().mockResolvedValue(mockContestObj),
        }),
      });

      const result = await service.registerContest('507f1f77bcf86cd799439011', {
        studentId: 'student-new',
        studentName: 'Tran Van B',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
    });

    it('should throw BadRequestException if contest has already ended', async () => {
      mockContestModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockContestObj,
          endTime: new Date(Date.now() - 10000), // past end time
        }),
      });

      await expect(
        service.registerContest('507f1f77bcf86cd799439011', { studentId: 'student-late' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkContestStatus', () => {
    it('should return server time guard response with ONGOING status', async () => {
      mockContestModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockContestObj),
      });

      const statusRes = await service.checkContestStatus('507f1f77bcf86cd799439011', 'student-1');

      expect(statusRes).toBeDefined();
      expect(statusRes.computedStatus).toBe('ONGOING');
      expect(statusRes.isAllowedToJoin).toBe(true);
      expect(statusRes.isAllowedToSubmit).toBe(true);
      expect(statusRes.serverTime).toBeDefined();
    });

    it('should return UPCOMING status and disallow joining if contest has not started', async () => {
      mockContestModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockContestObj,
          startTime: new Date(Date.now() + 3600000), // starts in 1 hour
          endTime: new Date(Date.now() + 7200000),
        }),
      });

      const statusRes = await service.checkContestStatus('507f1f77bcf86cd799439011');
      expect(statusRes.computedStatus).toBe('UPCOMING');
      expect(statusRes.isAllowedToJoin).toBe(false);
      expect(statusRes.isAllowedToSubmit).toBe(false);
      expect(statusRes.message).toContain('chưa bắt đầu');
    });
  });
});
