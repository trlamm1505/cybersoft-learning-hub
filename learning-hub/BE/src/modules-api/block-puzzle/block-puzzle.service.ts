import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BlockPuzzleProgress,
  BlockPuzzleProgressDocument,
} from '../../modules-system/database/schemas/block-puzzle-progress.schema';
import { CompleteLessonDto } from './dto/complete-lesson.dto';

@Injectable()
export class BlockPuzzleService {
  constructor(
    @InjectModel(BlockPuzzleProgress.name)
    private readonly progressModel: Model<BlockPuzzleProgressDocument>,
  ) {}

  /**
   * Trả về danh sách slug các bài Block Puzzle mà user này đã hoàn thành —
   * dùng để tính sequential-unlock ("ải") ở phía FE, thay cho localStorage.
   */
  async getCompletedSlugs(userId: string): Promise<string[]> {
    const rows = await this.progressModel
      .find({ userId })
      .select('lessonSlug')
      .lean();
    return rows.map((r) => r.lessonSlug);
  }

  /**
   * Đánh dấu một bài đã hoàn thành cho user hiện tại. Idempotent: hoàn thành
   * lại một bài đã xong trước đó không tạo bản ghi trùng (nhờ unique index
   * trên (userId, lessonSlug)) và không lỗi — chỉ trả về bản ghi đã có.
   */
  async markCompleted(userId: string, dto: CompleteLessonDto) {
    const { lessonSlug, gameId } = dto;

    const existing = await this.progressModel.findOne({ userId, lessonSlug }).lean();
    if (existing) {
      return { alreadyCompleted: true, completedAt: existing.completedAt };
    }

    const created = await this.progressModel.create({
      userId,
      lessonSlug,
      gameId,
      completedAt: new Date(),
    });

    return { alreadyCompleted: false, completedAt: created.completedAt };
  }
}
