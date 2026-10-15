import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BlockPuzzleService } from './block-puzzle.service';
import { BlockPuzzleProgress } from '../../modules-system/database/schemas/block-puzzle-progress.schema';
import { User } from '../../modules-system/database/schemas/user.schema';
import { Lesson } from '../../modules-system/database/schemas/lesson.schema';

describe('BlockPuzzleService.markCompleted — chống gửi thành tích giả', () => {
  let service: BlockPuzzleService;
  const progress: any = { findOne: jest.fn(), create: jest.fn() };
  const lessons: any = {
    find: jest.fn().mockReturnValue({
      select: () => ({
        lean: jest.fn().mockResolvedValue([
          { slug: 'block-robot-ve-nha-1', status: 'published', blockPuzzle: { gameId: 'robot-ve-nha' } },
        ]),
      }),
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    progress.create.mockResolvedValue({ completedAt: new Date() });
    const module = await Test.createTestingModule({
      providers: [
        BlockPuzzleService,
        { provide: getModelToken(BlockPuzzleProgress.name), useValue: progress },
        { provide: getModelToken(User.name), useValue: {} },
        { provide: getModelToken(Lesson.name), useValue: lessons },
      ],
    }).compile();
    service = module.get(BlockPuzzleService);
  });

  // findOne(...).lean() và findOne(...).sort(...).lean() cùng trả value.
  const chain = (value: unknown) => {
    const c = { lean: jest.fn().mockResolvedValue(value) };
    return { ...c, sort: () => c };
  };
  const longAgo = { completedAt: new Date(Date.now() - 3600_000) };

  it('từ chối slug bịa hoặc gameId không tồn tại', async () => {
    await expect(service.markCompleted('u', { lessonSlug: 'bia-dat', gameId: 'blockly-maze' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.markCompleted('u', { lessonSlug: 'blockly-maze-level-1', gameId: 'khong-co' })).rejects.toBeInstanceOf(BadRequestException);
    expect(progress.create).not.toHaveBeenCalled();
  });

  it('từ chối slug của game này gửi kèm gameId của game khác', async () => {
    await expect(
      service.markCompleted('u', { lessonSlug: 'blockly-turtle-level-1', gameId: 'blockly-maze' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('game dựng sẵn: không được nhảy cóc, phải xong màn trước', async () => {
    progress.findOne.mockReturnValue(chain(null)); // chưa có màn 4
    await expect(
      service.markCompleted('u', { lessonSlug: 'blockly-maze-level-5', gameId: 'blockly-maze' }),
    ).rejects.toThrow('Hãy hoàn thành màn trước');
    expect(progress.create).not.toHaveBeenCalled();
  });

  it('màn 1 và màn kế tiếp khi đã xong màn trước thì được ghi nhận', async () => {
    progress.findOne.mockReturnValueOnce(chain(null)); // màn 1: chưa có bản ghi của chính nó
    progress.findOne.mockReturnValueOnce(chain(null)); // chưa có màn nào trước đó trong game
    await expect(
      service.markCompleted('u', { lessonSlug: 'blockly-maze-level-1', gameId: 'blockly-maze' }),
    ).resolves.toMatchObject({ alreadyCompleted: false });

    progress.findOne.mockReturnValueOnce(chain({ lessonSlug: 'blockly-maze-level-1' })); // thứ tự: đã xong màn 1
    progress.findOne.mockReturnValueOnce(chain(null)); // màn 2 chưa có
    progress.findOne.mockReturnValueOnce(chain(longAgo)); // màn trước xong cách đây 1 giờ
    await expect(
      service.markCompleted('u', { lessonSlug: 'blockly-maze-level-2', gameId: 'blockly-maze' }),
    ).resolves.toMatchObject({ alreadyCompleted: false });
  });

  it('từ chối màn nộp quá nhanh sau màn trước (minCompletionTimeSec)', async () => {
    progress.findOne
      .mockReturnValueOnce(chain({ lessonSlug: 'blockly-maze-level-1' })) // màn 1 đã xong (kiểm tra thứ tự)
      .mockReturnValueOnce(chain(null)) // màn 2 chưa có
      .mockReturnValueOnce(chain({ completedAt: new Date(Date.now() - 2000) })); // màn trước vừa xong 2 giây
    await expect(
      service.markCompleted('u', { lessonSlug: 'blockly-maze-level-2', gameId: 'blockly-maze' }),
    ).rejects.toThrow('Thao tác quá nhanh, vui lòng tự giải đố nhé!');
    expect(progress.create).not.toHaveBeenCalled();
  });

  it('đặt BLOCK_PUZZLE_MIN_LEVEL_SEC=0 thì tắt kiểm tra thời gian', async () => {
    process.env.BLOCK_PUZZLE_MIN_LEVEL_SEC = '0';
    try {
      progress.findOne
        .mockReturnValueOnce(chain({ lessonSlug: 'blockly-maze-level-1' })) // thứ tự
        .mockReturnValueOnce(chain(null)); // màn 2 chưa có (bỏ qua kiểm tra thời gian)
      await expect(
        service.markCompleted('u', { lessonSlug: 'blockly-maze-level-2', gameId: 'blockly-maze' }),
      ).resolves.toMatchObject({ alreadyCompleted: false });
    } finally {
      delete process.env.BLOCK_PUZZLE_MIN_LEVEL_SEC;
    }
  });

  it('game của giảng viên: slug thuộc game thì được ghi nhận', async () => {
    progress.findOne.mockReturnValue(chain(null));
    await expect(
      service.markCompleted('u', { lessonSlug: 'block-robot-ve-nha-1', gameId: 'robot-ve-nha' }),
    ).resolves.toMatchObject({ alreadyCompleted: false });
  });
});
