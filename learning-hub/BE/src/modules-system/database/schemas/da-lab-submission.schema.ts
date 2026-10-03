import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DaLabSubmissionDocument = DaLabSubmission & Document;

/**
 * GRADED: AI chấm xong, có điểm. PENDING_REVIEW: AI không chấm (bài bị từ
 * chối ở guardrail, chưa cấu hình model, đầu ra AI không hợp lệ, lỗi hệ
 * thống), chờ giảng viên chấm tay.
 */
export type DaLabSubmissionStatus = 'GRADED' | 'PENDING_REVIEW';

/**
 * Bài nộp Insight của DA Lab. Tách khỏi `submissions` (của Judge Python)
 * để MasteryService/Recommendation không đọc nhầm bài DA, giống cách
 * Tester Lab (Day 21) dùng collection riêng.
 */
@Schema({ timestamps: true, collection: 'da_lab_submissions' })
export class DaLabSubmission {
  @Prop({ required: true, type: String, index: true })
  userId: string;

  @Prop({ required: true, type: String, index: true })
  exerciseId: string;

  @Prop({ required: true, type: String })
  exerciseSlug: string;

  /** Câu trả lời Insight của học viên. */
  @Prop({ required: true, type: String })
  content: string;

  @Prop({
    required: true,
    type: String,
    enum: ['GRADED', 'PENDING_REVIEW'],
    index: true,
  })
  status: DaLabSubmissionStatus;

  @Prop({ type: Number, default: 0 })
  score: number;

  @Prop({ required: true, type: Number })
  maxScore: number;

  /** Nhận xét tổng của AI (GRADED) hoặc lý do chuyển chấm tay (PENDING_REVIEW). */
  @Prop({ type: String, default: '' })
  aiExplanation: string;

  /** Điểm từng tiêu chí rubric, kèm trích dẫn bằng chứng và cờ guardrail. */
  @Prop({ type: [Object], default: [] })
  criteria: object[];

  /** Nhận xét của giảng viên khi chấm tay (PUT /teacher/submissions/:id/review). */
  @Prop({ type: String })
  teacherComment?: string;

  @Prop({ type: String })
  reviewedBy?: string;

  @Prop({ type: Date })
  reviewedAt?: Date;
}

export const DaLabSubmissionSchema =
  SchemaFactory.createForClass(DaLabSubmission);
DaLabSubmissionSchema.index({ status: 1, createdAt: 1 });
