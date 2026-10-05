import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubmissionDocument = Submission & Document;

@Schema({ _id: false })
export class SubmissionTestResult {
  @Prop({ type: Number, required: true })
  index: number;

  @Prop({ type: Boolean, required: true })
  passed: boolean;

  @Prop({ type: Boolean, default: false })
  isHidden: boolean;

  @Prop({ type: String })
  input?: string;

  @Prop({ type: String })
  expectedOutput?: string;

  @Prop({ type: String })
  actualOutput?: string;

  @Prop({ type: String })
  stderr?: string;

  @Prop({ type: Number })
  executionTimeMs?: number;

  @Prop({ type: Number })
  memoryUsedMb?: number;
}

export const SubmissionTestResultSchema =
  SchemaFactory.createForClass(SubmissionTestResult);

export type IntegrityFlag = 'NONE' | 'REVIEW';
export type IntegrityReviewStatus = 'NORMAL' | 'NEEDS_REVIEW' | 'REVIEWED';
export type IntegrityDecision = 'CLEARED' | 'CONCERN' | 'FOLLOW_UP';

/**
 * Tín hiệu liêm chính (Day 24). CHỈ là dữ liệu hỗ trợ giảng viên xem xét:
 * không có trường nào ảnh hưởng điểm, trạng thái chấm hay quyền nộp lại.
 * Thu thập tối thiểu: mốc thời gian, lần rời tab (không ghi trang nào, không
 * ghi phím bấm) và điểm tương đồng. `decision` do giảng viên đặt, không do máy.
 */
export interface IntegritySignals {
  timeline: {
    startedAt: Date;
    submittedAt: Date;
    /** Mốc chỉnh sửa thô (tối đa 50): thời điểm + số ký tự, không lưu nội dung. */
    editMarks: Array<{ at: Date; charCount: number }>;
    totalSeconds: number;
    /** Thời lượng thao tác thực tế = tổng thời gian trừ thời gian rời màn hình. */
    activeSeconds: number;
  };
  focusEvents: Array<{ leftAt: Date; returnedAt: Date; awaySeconds: number }>;
  focusSummary: { count: number; totalAwaySeconds: number };
  similarity: {
    score: number;
    matchedSubmissionId?: string;
    matchedUserId?: string;
    flagged: boolean;
  };
  flag: IntegrityFlag;
  /** Lý do gắn cờ, viết cho người đọc; rỗng khi flag = NONE. */
  reasons: string[];
  reviewStatus: IntegrityReviewStatus;
  decision?: IntegrityDecision;
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

@Schema({ timestamps: true, collection: 'submissions' })
export class Submission {
  @Prop({ required: true, type: String })
  exerciseId: string;

  @Prop({ type: String })
  userId?: string;

  @Prop({ required: true, type: String })
  code: string;

  @Prop({
    type: String,
    enum: ['QUEUED', 'RUNNING', 'AC', 'WA', 'TLE', 'RE', 'CE', 'FAILED'],
    default: 'QUEUED',
  })
  status: string;

  @Prop({ type: Number, default: 0 })
  passedCount: number;

  @Prop({ type: Number, default: 0 })
  totalCount: number;

  @Prop({ type: [SubmissionTestResultSchema], default: [] })
  results: SubmissionTestResult[];

  @Prop({ type: String })
  errorMessage?: string;

  @Prop({ type: String, index: true, sparse: true, unique: true })
  idempotencyKey?: string;

  @Prop({ type: Number })
  memoryUsedMb?: number;

  @Prop({ type: Number, default: 0 })
  attempts: number;

  /** Day 24: tín hiệu liêm chính, chỉ giảng viên đọc (không nằm trong select của judge controller). */
  @Prop({ type: Object })
  integrity?: IntegritySignals;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);

// Hàng chờ giảng viên: lọc theo cờ/trạng thái duyệt, mới nhất trước.
SubmissionSchema.index({ 'integrity.reviewStatus': 1, createdAt: -1 });
// So khớp tương đồng: các bài nộp khác của cùng một bài tập.
SubmissionSchema.index({ exerciseId: 1, createdAt: -1 });
