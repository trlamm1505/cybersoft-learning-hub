import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockPuzzleProgressDocument = BlockPuzzleProgress & Document;

/**
 * Lưu tiến độ hoàn thành bài Block Puzzle theo TÀI KHOẢN thật trên server —
 * thay cho localStorage (chỉ tồn tại trên một trình duyệt/máy, mất khi xoá
 * dữ liệu trình duyệt hoặc đổi thiết bị). Một document = một lần một user
 * hoàn thành một bài (lessonSlug), unique theo cặp (userId, lessonSlug) nên
 * hoàn thành lại một bài đã xong không tạo bản ghi trùng.
 */
@Schema({ timestamps: true, collection: 'block_puzzle_progress' })
export class BlockPuzzleProgress {
  @Prop({ required: true, type: String, index: true })
  userId: string;

  @Prop({ required: true, type: String })
  lessonSlug: string;

  @Prop({ required: true, type: String, index: true })
  gameId: string;

  @Prop({ type: Date, default: Date.now })
  completedAt: Date;
}

export const BlockPuzzleProgressSchema = SchemaFactory.createForClass(BlockPuzzleProgress);

BlockPuzzleProgressSchema.index({ userId: 1, lessonSlug: 1 }, { unique: true });
