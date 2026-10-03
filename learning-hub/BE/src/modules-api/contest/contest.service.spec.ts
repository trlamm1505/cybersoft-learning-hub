import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ContestService } from './contest.service';
import { Contest } from '../../modules-system/database/schemas/contest.schema';
import { User } from '../../modules-system/database/schemas/user.schema';

describe('ContestService', () => {
  let service: ContestService;
  let mockContestModel: any;
  let mockUserModel: any;

  const mockContestObj = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Contest',
    slug: 'test-contest',
    startTime: new Date(Date.now() - 10 * 60 * 1000), // 10m ago
    endTime: new Date(Date.now() + 50 * 60 * 1000), // in 50m
    durationMinutes: 60,
    registrations: [
      {
        studentId: 'student-1',
        studentName: 'Nguyen Van A',
        registeredAt: new Date(),
      },
    ],
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
      save: jest
        .fn()
        .mockResolvedValue({ ...dto, _id: '507f1f77bcf86cd799439011' }),
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

    mockContestModel.findByIdAndDelete = jest
      .fn()
      .mockResolvedValue(mockContestObj);
    mockContestModel.countDocuments = jest.fn().mockResolvedValue(1);

    mockUserModel = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ fullName: 'Nguyen Van A' }),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContestService,
        {
          provide: getModelToken(Contest.name),
          useValue: mockContestModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
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
        service.createContest(
          {
            title: 'Invalid Time Contest',
            startTime: new Date(now.getTime() + 600000),
            endTime: now,
          },
          'teacher-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create contest successfully with valid times', async () => {
      mockContestModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const now = new Date();
      const result = await service.createContest(
        {
          title: 'New Contest 2026',
          startTime: now,
          endTime: new Date(now.getTime() + 3600000),
        },
        'teacher-1',
      );

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

      const result = await service.registerContest('507f1f77bcf86cd799439011', 'student-new');

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
        service.registerContest('507f1f77bcf86cd799439011', 'student-late'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkContestStatus', () => {
    it('should return server time guard response with ONGOING status', async () => {
      mockContestModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockContestObj),
      });

      const statusRes = await service.checkContestStatus(
        '507f1f77bcf86cd799439011',
        'student-1',
      );

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

      const statusRes = await service.checkContestStatus(
        '507f1f77bcf86cd799439011',
      );
      expect(statusRes.computedStatus).toBe('UPCOMING');
      expect(statusRes.isAllowedToJoin).toBe(false);
      expect(statusRes.isAllowedToSubmit).toBe(false);
      expect(statusRes.message).toContain('chưa bắt đầu');
    });
  });

  describe('IDOR — ownership check (assertCanModify via updateContest/deleteContest)', () => {
    const teacherA = { sub: 'teacher-a', role: 'TEACHER' };
    const teacherB = { sub: 'teacher-b', role: 'TEACHER' };
    const admin = { sub: 'admin-1', role: 'ADMIN' };

    function ownedContest(authorId?: string) {
      return {
        ...mockContestObj,
        authorId,
        save: jest.fn().mockResolvedValue({ ...mockContestObj, authorId }),
      };
    }

    it('KHÔNG cho Teacher B sửa contest do Teacher A tạo', async () => {
      mockContestModel.findById = jest.fn().mockResolvedValue(ownedContest('teacher-a'));

      await expect(
        service.updateContest(
          '507f1f77bcf86cd799439011',
          { title: 'Hacked' } as any,
          teacherB,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('cho phép chính Teacher A (chủ sở hữu) sửa contest của mình', async () => {
      mockContestModel.findById = jest.fn().mockResolvedValue(ownedContest('teacher-a'));

      await expect(
        service.updateContest(
          '507f1f77bcf86cd799439011',
          { title: 'Sua boi chinh chu' } as any,
          teacherA,
        ),
      ).resolves.toBeDefined();
    });

    it('ADMIN sửa được contest của bất kỳ giáo viên nào', async () => {
      mockContestModel.findById = jest.fn().mockResolvedValue(ownedContest('teacher-a'));

      await expect(
        service.updateContest(
          '507f1f77bcf86cd799439011',
          { title: 'Admin sua' } as any,
          admin,
        ),
      ).resolves.toBeDefined();
    });

    it('contest seed với authorId "teacher-1" được coi là dùng chung, Teacher B vẫn sửa được', async () => {
      mockContestModel.findById = jest.fn().mockResolvedValue(ownedContest('teacher-1'));

      await expect(
        service.updateContest(
          '507f1f77bcf86cd799439011',
          { title: 'Sua contest seed' } as any,
          teacherB,
        ),
      ).resolves.toBeDefined();
    });

    it('KHÔNG cho Teacher B xoá contest của Teacher A', async () => {
      mockContestModel.findById = jest.fn().mockResolvedValue(ownedContest('teacher-a'));

      await expect(
        service.deleteContest('507f1f77bcf86cd799439011', teacherB),
      ).rejects.toThrow(ForbiddenException);
    });

    it('cho phép Teacher A xoá contest của chính mình', async () => {
      mockContestModel.findById = jest.fn().mockResolvedValue(ownedContest('teacher-a'));
      mockContestModel.findByIdAndDelete = jest
        .fn()
        .mockResolvedValue(ownedContest('teacher-a'));

      const result = await service.deleteContest('507f1f77bcf86cd799439011', teacherA);
      expect(result.success).toBe(true);
    });
  });
});
