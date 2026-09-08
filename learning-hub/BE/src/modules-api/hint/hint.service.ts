import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hint, HintDocument, validateTier1NoCode } from '../../modules-system/database/schemas/hint.schema';
import { HintUsage, HintUsageDocument } from '../../modules-system/database/schemas/hint-usage.schema';
import { UnlockHintDto } from './dto/unlock-hint.dto';
import { INITIAL_HINTS } from '../../data/initial-hints';

@Injectable()
export class HintService implements OnModuleInit {
  private readonly logger = new Logger(HintService.name);

  constructor(
    @InjectModel(Hint.name) private readonly hintModel: Model<HintDocument>,
    @InjectModel(HintUsage.name) private readonly hintUsageModel: Model<HintUsageDocument>,
  ) {}

  /**
   * Auto-seed 30 sample hints when module starts if DB is empty
   */
  async onModuleInit() {
    this.logger.log('Syncing 30 initial sample hints into MongoDB...');
    await this.seedHints();
  }

  /**
   * Lấy danh sách hints theo bài tập (kèm trạng thái mở đối với học viên)
   */
  async getHintsByExercise(exerciseSlug: string, userId?: string) {
    const hints = await this.hintModel
      .find({ exerciseSlug })
      .sort({ level: 1 })
      .exec();

    if (!hints || hints.length === 0) {
      return {
        exerciseSlug,
        cooldownRemainingSeconds: 0,
        hints: [],
      };
    }

    let userUsages: HintUsageDocument[] = [];
    let cooldownRemainingSeconds = 0;

    if (userId) {
      userUsages = await this.hintUsageModel
        .find({ userId, exerciseSlug })
        .exec();

      // Check last unlock time for cooldown calculation
      const lastUsage = await this.hintUsageModel
        .findOne({ userId, exerciseSlug })
        .sort({ unlockedAt: -1 })
        .exec();

      if (lastUsage) {
        const timePassedSeconds = (Date.now() - new Date(lastUsage.unlockedAt).getTime()) / 1000;
        // Default cooldown threshold is 30s
        const defaultCooldown = 30;
        if (timePassedSeconds < defaultCooldown) {
          cooldownRemainingSeconds = Math.ceil(defaultCooldown - timePassedSeconds);
        }
      }
    }

    const unlockedLevelsMap = new Set(userUsages.map((u) => u.level));

    const formattedHints = hints.map((hint) => {
      const isUnlocked = userId ? unlockedLevelsMap.has(hint.level) : false;
      return {
        id: hint._id,
        exerciseSlug: hint.exerciseSlug,
        level: hint.level,
        title: hint.title,
        costPoints: hint.costPoints,
        cooldownSeconds: hint.cooldownSeconds,
        isUnlocked,
        // Núp nội dung gợi ý nếu học viên chưa unlock
        content: isUnlocked ? hint.content : null,
      };
    });

    return {
      exerciseSlug,
      cooldownRemainingSeconds,
      hints: formattedHints,
    };
  }

  /**
   * Mở (Unlock) một gợi ý cấp độ requested cho học viên
   */
  async unlockHint(dto: UnlockHintDto) {
    const { exerciseSlug, level, userId } = dto;

    const hint = await this.hintModel.findOne({ exerciseSlug, level }).exec();
    if (!hint) {
      throw new NotFoundException(`Không tìm thấy gợi ý tầng ${level} cho bài tập "${exerciseSlug}"`);
    }

    // 1. Kiểm tra nếu học viên đã unlock level này trước đây
    const existingUsage = await this.hintUsageModel
      .findOne({ userId, exerciseSlug, level })
      .exec();

    if (existingUsage) {
      return {
        message: `Gợi ý Tầng ${level} đã được mở trước đó.`,
        alreadyUnlocked: true,
        hint: {
          id: hint._id,
          exerciseSlug: hint.exerciseSlug,
          level: hint.level,
          title: hint.title,
          content: hint.content,
          costPoints: 0,
        },
        unlockedAt: existingUsage.unlockedAt,
        cooldownRemainingSeconds: 0,
      };
    }

    // 2. Kiểm tra Cooldown kể từ lần mở gợi ý gần nhất của bài tập này
    const lastUsage = await this.hintUsageModel
      .findOne({ userId, exerciseSlug })
      .sort({ unlockedAt: -1 })
      .exec();

    if (lastUsage) {
      const timePassedSeconds = (Date.now() - new Date(lastUsage.unlockedAt).getTime()) / 1000;
      if (timePassedSeconds < hint.cooldownSeconds) {
        const remainingSeconds = Math.ceil(hint.cooldownSeconds - timePassedSeconds);
        throw new BadRequestException({
          statusCode: 400,
          error: 'CooldownActive',
          message: `Bạn phải chờ thêm ${remainingSeconds} giây trước khi mở gợi ý tiếp theo.`,
          cooldownRemainingSeconds: remainingSeconds,
        });
      }
    }

    // 3. Đăng ký mở gợi ý mới và trừ điểm (simulated points cost)
    const newUsage = await this.hintUsageModel.create({
      userId,
      exerciseSlug,
      hintId: hint._id,
      level,
      unlockedAt: new Date(),
      costPoints: hint.costPoints,
    });

    return {
      message: `Đã mở gợi ý Tầng ${level} thành công!`,
      alreadyUnlocked: false,
      hint: {
        id: hint._id,
        exerciseSlug: hint.exerciseSlug,
        level: hint.level,
        title: hint.title,
        content: hint.content,
        costPointsDeducted: hint.costPoints,
      },
      unlockedAt: newUsage.unlockedAt,
      cooldownRemainingSeconds: hint.cooldownSeconds,
    };
  }

  /**
   * Trả về lịch sử xem hint của học viên
   */
  async getUserHintHistory(userId: string) {
    const history = await this.hintUsageModel
      .find({ userId })
      .sort({ unlockedAt: -1 })
      .populate('hintId')
      .exec();

    return {
      userId,
      totalHintsUnlocked: history.length,
      history,
    };
  }

  /**
   * Khởi tạo / Seed 30 gợi ý mẫu
   */
  async seedHints() {
    let seededCount = 0;
    for (const item of INITIAL_HINTS) {
      // Validate tier 1 constraint
      if (item.level === 1 && !validateTier1NoCode(item.content, 1)) {
        throw new BadRequestException(
          `Gợi ý Tầng 1 cho bài "${item.exerciseSlug}" chứa cú pháp code không hợp lệ!`,
        );
      }

      await this.hintModel.findOneAndUpdate(
        { exerciseSlug: item.exerciseSlug, level: item.level },
        {
          title: item.title,
          content: item.content,
          costPoints: item.costPoints,
          cooldownSeconds: item.cooldownSeconds,
        },
        { upsert: true, new: true },
      );
      seededCount++;
    }

    return {
      message: `Đã seed thành công ${seededCount} gợi ý mẫu cho 10 bài tập!`,
      totalSeeded: seededCount,
    };
  }

  /**
   * Trả về dữ liệu 30 hint mẫu phục vụ kiểm thử
   */
  async get30SampleHints() {
    const hints = await this.hintModel.find().sort({ exerciseSlug: 1, level: 1 }).exec();
    if (hints.length < 30) {
      await this.seedHints();
      return this.hintModel.find().sort({ exerciseSlug: 1, level: 1 }).exec();
    }
    return hints;
  }
}
