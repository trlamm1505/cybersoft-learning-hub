import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { IntegritySignals } from './submission.schema';

export type ContestAttemptDocument = ContestAttempt & Document;

export type ContestAttemptFinishReason = 'MANUAL' | 'TIMEOUT';

/** Tín hiệu liêm chính của cả lượt thi; thêm bài code cho điểm tương đồng cao nhất. */
export type ContestIntegrity = IntegritySignals & {
  similarityProblemSlug?: string;
};

/**
 * Lượt thi của một học viên trong một cuộc thi (Day 24). Đồng hồ cá nhân do
 * SERVER giữ (startedAt/deadlineAt) thay cho localStorage: xóa dữ liệu trình
 * duyệt hay đổi máy không còn cấp thêm giờ hay cho thi lại. Mỗi học viên chỉ
 * có một lượt (unique contestId + studentId).
 */
@Schema({ timestamps: true, collection: 'contest_attempts' })
export class ContestAttempt {
  @Prop({ required: true, type: String, index: true })
  contestId: string;

  @Prop({ required: true, type: String })
  studentId: string;

  @Prop({ type: String, default: 'Học viên' })
  studentName?: string;

  @Prop({ required: true, type: Date })
  startedAt: Date;

  /** min(startedAt + thời lượng cá nhân, giờ kết thúc cuộc thi). */
  @Prop({ required: true, type: Date })
  deadlineAt: Date;

  @Prop({ type: Date })
  finishedAt?: Date;

  @Prop({ type: String, enum: ['MANUAL', 'TIMEOUT'] })
  finishReason?: ContestAttemptFinishReason;

  /** Chỉ có khi cuộc thi bật giám sát; không bao giờ ảnh hưởng điểm. */
  @Prop({ type: Object })
  integrity?: ContestIntegrity;
}

export const ContestAttemptSchema = SchemaFactory.createForClass(ContestAttempt);
ContestAttemptSchema.index({ contestId: 1, studentId: 1 }, { unique: true });
ContestAttemptSchema.index({ contestId: 1, 'integrity.reviewStatus': 1 });
