import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BlockPuzzleService } from './block-puzzle.service';
import { BlockPuzzleProgress } from '../../modules-system/database/schemas/block-puzzle-progress.schema';

describe('BlockPuzzleService', () => {
  let service: BlockPuzzleService;

  const mockProgressModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockPuzzleService,
        { provide: getModelToken(BlockPuzzleProgress.name), useValue: mockProgressModel },
      ],
    }).compile();

    service = module.get<BlockPuzzleService>(BlockPuzzleService);
  });

  describe('getCompletedSlugs', () => {
    it('trả về danh sách slug đã hoàn thành của đúng userId', async () => {
      mockProgressModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { lessonSlug: 'block-robot-ve-nha-1' },
            { lessonSlug: 'block-robot-ve-nha-2' },
          ]),
        }),
      });

      const result = await service.getCompletedSlugs('user1');

      expect(mockProgressModel.find).toHaveBeenCalledWith({ userId: 'user1' });
      expect(result).toEqual(['block-robot-ve-nha-1', 'block-robot-ve-nha-2']);
    });

    it('trả về mảng rỗng khi chưa hoàn thành bài nào', async () => {
      mockProgressModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      });

      const result = await service.getCompletedSlugs('user1');
      expect(result).toEqual([]);
    });
  });

  describe('markCompleted', () => {
    it('tạo bản ghi mới khi lần đầu hoàn thành bài này', async () => {
      mockProgressModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      const fakeDate = new Date('2026-01-01T00:00:00Z');
      mockProgressModel.create.mockResolvedValue({ completedAt: fakeDate });

      const result = await service.markCompleted('user1', {
        lessonSlug: 'block-robot-ve-nha-1',
        gameId: 'robot-ve-nha',
      });

      expect(mockProgressModel.findOne).toHaveBeenCalledWith({
        userId: 'user1',
        lessonSlug: 'block-robot-ve-nha-1',
      });
      expect(mockProgressModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user1', lessonSlug: 'block-robot-ve-nha-1', gameId: 'robot-ve-nha' }),
      );
      expect(result.alreadyCompleted).toBe(false);
    });

    it('idempotent — hoàn thành lại một bài đã xong không tạo bản ghi trùng', async () => {
      const existingDate = new Date('2026-01-01T00:00:00Z');
      mockProgressModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ completedAt: existingDate }),
      });

      const result = await service.markCompleted('user1', {
        lessonSlug: 'block-robot-ve-nha-1',
        gameId: 'robot-ve-nha',
      });

      expect(mockProgressModel.create).not.toHaveBeenCalled();
      expect(result.alreadyCompleted).toBe(true);
      expect(result.completedAt).toBe(existingDate);
    });
  });
});
