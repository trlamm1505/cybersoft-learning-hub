import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AssessmentType } from '../../../modules-api/assessment/domain/assessment-policy';
import { SUBMISSION_STATES, SubmissionState } from '../../../modules-api/assessment/domain/submission-state';

// ---------------------------------------------------------------------------------------------
// assessments: bài đánh giá của một lớp, phân loại bằng assessmentType (ASSIGNMENT | CONTEST | EXAM).
// ---------------------------------------------------------------------------------------------
export type AssessmentDocument = Assessment & Document;

@Schema({ timestamps: true, collection: 'assessments' })
export class Assessment {
  @Prop({ required: true, type: String, index: true })
  classId: string;

  @Prop({ required: true, type: String, enum: Object.values(AssessmentType), index: true })
  assessmentType: AssessmentType;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({ type: Number, default: 100 })
  maxScore: number;

  /** ASSIGNMENT / EXAM: hạn nộp. */
  @Prop({ type: Date })
  dueDate?: Date;

  /** CONTEST: giờ bắt đầu và thời lượng cố định. */
  @Prop({ type: Date })
  startTime?: Date;

  @Prop({ type: Number })
  durationMinutes?: number;

  /** Chụp lại chính sách lúc tạo (số lượt, ân hạn, cửa sổ trễ...) để đổi chính sách sau này không ảnh hưởng bài cũ. */
  @Prop({ type: Number, required: true })
  maxAttempts: number;

  @Prop({ type: Number, default: 0 })
  gracePeriodMs: number;

  @Prop({ type: Number, default: 0 })
  lateWindowMs: number;

  @Prop({ type: Boolean, default: false })
  hideDetails: boolean;

  @Prop({ required: true, type: String })
  createdBy: string;
}

export const AssessmentSchema = SchemaFactory.createForClass(Assessment);
AssessmentSchema.index({ classId: 1, assessmentType: 1 });

// ---------------------------------------------------------------------------------------------
// assessment_submissions: mỗi lượt nộp là một bản ghi; trạng thái theo state machine (submission-state.ts).
// ---------------------------------------------------------------------------------------------
export interface StateChange {
  from: SubmissionState | null;
  to: SubmissionState;
  by: string;
  actor: 'OWNER' | 'CLASS_TEACHER' | 'SYSTEM';
  at: Date;
  reason?: string;
}

export type AssessmentSubmissionDocument = AssessmentSubmission & Document;

@Schema({ timestamps: true, collection: 'assessment_submissions' })
export class AssessmentSubmission {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Assessment', index: true })
  assessmentId: Types.ObjectId;

  @Prop({ required: true, type: String, index: true })
  classId: string;

  @Prop({ required: true, type: String, index: true })
  studentId: string;

  @Prop({ required: true, type: Number })
  attemptNo: number;

  @Prop({ required: true, type: String, enum: SUBMISSION_STATES, default: SubmissionState.DRAFT, index: true })
  state: SubmissionState;

  /** Nội dung bài làm (code, đáp án...). */
  @Prop({ type: Object, default: {} })
  content: Record<string, unknown>;

  @Prop({ type: Date })
  submittedAt?: Date;

  @Prop({ type: Boolean, default: false })
  isLate: boolean;

  /** Điểm giảng viên chấm (trước trần LATE) và điểm hiệu lực sau trần; null khi chưa chấm. */
  @Prop({ type: Number, default: null })
  rawScore: number | null;

  @Prop({ type: Number, default: null })
  score: number | null;

  /** Chi tiết chấm (test case, nhận xét từng câu): ẩn với học viên ở bài EXAM. */
  @Prop({ type: Object })
  details?: Record<string, unknown>;

  @Prop({ type: String, default: '' })
  feedback: string;

  @Prop({ type: String })
  gradedBy?: string;

  @Prop({ type: Date })
  gradedAt?: Date;

  @Prop({ type: Date })
  publishedAt?: Date;

  @Prop({ type: Object })
  appeal?: { reason: string; at: Date };

  @Prop({ type: String })
  invalidReason?: string;

  /** CONTEST: số lần rời màn hình được tính (mỗi lần >= 5 giây) và cờ đã tự nộp. */
  @Prop({ type: Number, default: 0 })
  leaveCount: number;

  @Prop({ type: Boolean, default: false })
  forceSubmitted: boolean;

  @Prop({ type: [String], default: [] })
  flags: string[];

  @Prop({ type: Array, default: [] })
  history: StateChange[];
}

export const AssessmentSubmissionSchema = SchemaFactory.createForClass(AssessmentSubmission);
AssessmentSubmissionSchema.index({ assessmentId: 1, studentId: 1, attemptNo: 1 }, { unique: true });
