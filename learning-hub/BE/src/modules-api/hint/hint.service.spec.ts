import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HintService } from './hint.service';
import {
  Hint,
  validateTier1NoCode,
} from '../../modules-system/database/schemas/hint.schema';
import { HintUsage } from '../../modules-system/database/schemas/hint-usage.schema';

describe('HintService & Tier 1 Validation', () => {
  let service: HintService;

  const mockHintModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const mockHintUsageModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HintService,
        {
          provide: getModelToken(Hint.name),
          useValue: mockHintModel,
        },
        {
          provide: getModelToken(HintUsage.name),
          useValue: mockHintUsageModel,
        },
      ],
    }).compile();

    service = module.get<HintService>(HintService);
  });

  describe('Tier 1 Non-Code Validator', () => {
    it('cho phép văn bản khái niệm thuần túy không chứa code', () => {
      const validText =
        'Bài toán yêu cầu cộng hai đại lượng số nguyên từ đầu vào.';
      expect(validateTier1NoCode(validText, 1)).toBe(true);
    });

    it('từ chối khối code markdown (```)', () => {
      const invalidText =
        'Khái niệm:\n```python\na = int(input())\nprint(a)\n```';
      expect(validateTier1NoCode(invalidText, 1)).toBe(false);
    });

    it('từ chối khai báo hàm trong Python/JS (def / function)', () => {
      expect(validateTier1NoCode('Dùng hàm def calc(a, b):', 1)).toBe(false);
      expect(validateTier1NoCode('Khai báo function sum(a, b) {', 1)).toBe(
        false,
      );
    });

    it('từ chối câu lệnh in trực tiếp out (print() / console.log)', () => {
      expect(validateTier1NoCode('Gọi print(res) ra màn hình', 1)).toBe(false);
    });

    it('cho phép Level 2 và Level 3 chứa code/pseudocode', () => {
      const codeText = '```python\nprint(a + b)\n```';
      expect(validateTier1NoCode(codeText, 2)).toBe(true);
      expect(validateTier1NoCode(codeText, 3)).toBe(true);
    });
  });

  describe('unlockHint', () => {
    it('ném NotFoundException nếu không tìm thấy hint', async () => {
      mockHintModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.unlockHint(
          {
            exerciseSlug: 'boc-phenh',
            level: 1,
          },
          'user1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('trả về ngay nội dung nếu học viên đã unlock level này trước đó', async () => {
      const mockHint = {
        _id: 'hint123',
        exerciseSlug: 'tinh-tong-hai-so-nguyen',
        level: 1,
        title: 'Khái niệm',
        content: 'Nội dung khái niệm',
        costPoints: 5,
        cooldownSeconds: 30,
      };

      mockHintModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockHint),
      });

      mockHintUsageModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          userId: 'user1',
          exerciseSlug: 'tinh-tong-hai-so-nguyen',
          level: 1,
          unlockedAt: new Date(),
        }),
      });

      const res = await service.unlockHint(
        {
          exerciseSlug: 'tinh-tong-hai-so-nguyen',
          level: 1,
        },
        'user1',
      );

      expect(res.alreadyUnlocked).toBe(true);
      expect(res.hint.costPoints).toBe(0);
      expect(res.hint.content).toBe('Nội dung khái niệm');
    });

    it('từ chối mở hint mới nếu đang trong thời gian cooldown (< 30s)', async () => {
      const mockHint2 = {
        _id: 'hintLevel2',
        exerciseSlug: 'tinh-tong-hai-so-nguyen',
        level: 2,
        title: 'Chiến lược',
        content: 'Nội dung chiến lược',
        costPoints: 10,
        cooldownSeconds: 30,
      };

      mockHintModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockHint2),
      });

      // unlockHint() gọi findOne 3 lần theo thứ tự:
      // 1. existingUsage cho chính level 2 -> null (chưa mở tầng này)
      // 2. previousLevelUsage cho level 1 (bắt buộc mở tuần tự vì level > 1)
      //    -> có giá trị (tầng 1 đã mở trước đó), không thì sẽ ném lỗi khác
      // 3. lastUsage (có .sort()) để tính cooldown -> mở 10s trước, còn cooldown
      mockHintUsageModel.findOne
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue({ level: 1, unlockedAt: new Date(Date.now() - 20000) }),
        })
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              unlockedAt: new Date(Date.now() - 10000), // 10s ago
            }),
          }),
        });

      await expect(
        service.unlockHint(
          {
            exerciseSlug: 'tinh-tong-hai-so-nguyen',
            level: 2,
          },
          'user1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('mở hint thành công khi đã qua thời gian cooldown', async () => {
      const mockHint1 = {
        _id: 'hintLevel1',
        exerciseSlug: 'tinh-tong-hai-so-nguyen',
        level: 1,
        title: 'Khái niệm',
        content: 'Nội dung khái niệm',
        costPoints: 5,
        cooldownSeconds: 30,
      };

      mockHintModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockHint1),
      });

      mockHintUsageModel.findOne
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null),
        })
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              unlockedAt: new Date(Date.now() - 40000), // 40s ago > 30s
            }),
          }),
        });

      mockHintUsageModel.create.mockResolvedValue({
        unlockedAt: new Date(),
      });

      const res = await service.unlockHint(
        {
          exerciseSlug: 'tinh-tong-hai-so-nguyen',
          level: 1,
        },
        'user1',
      );

      expect(res.alreadyUnlocked).toBe(false);
      expect(res.hint.costPointsDeducted).toBe(5);
      expect(res.hint.content).toBe('Nội dung khái niệm');
    });
  });
});
