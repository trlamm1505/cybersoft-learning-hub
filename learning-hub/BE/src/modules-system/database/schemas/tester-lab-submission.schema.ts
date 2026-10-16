import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TesterLabSubmissionDocument = TesterLabSubmission & Document;

export type SubmissionStatus = 'SUBMITTED' | 'REVIEWED';

export interface AutoCheckResult {
  check: string;
  passed: boolean;
  message: string;
}

export interface RubricGrade {
  key: string;
  score: number;
  note?: string;
}

@Schema({ timestamps: true, collection: 'tester_lab_submissions' })
export class TesterLabSubmission {
  @Prop({ required: true, type: Types.ObjectId, ref: 'TesterLab', index: true })
  labId: Types.ObjectId;

  @Prop({ required: true, type: String, index: true })
  userId: string;

  /** Đường dẫn tương đối của file trong uploads/tester-labs. */
  @Prop({ required: true, type: String })
  artifactUrl: string;

  @Prop({ required: true, type: String })
  fileType: string;

  @Prop({ required: true, type: Number })
  fileSize: number;

  /** Nhận xét sơ bộ ngay khi nộp (luật/từ khóa); điểm chính thức do giảng viên chấm. */
  @Prop({ type: Array, default: [] })
  autoCheckResults: AutoCheckResult[];

  /** 'FORM': nộp bằng biểu mẫu test case + bug report (không có file); 'FILE': nộp file artifact. */
  @Prop({ type: String, enum: ['FILE', 'FORM'], default: 'FILE' })
  kind: 'FILE' | 'FORM';

  /** Nội dung biểu mẫu (chỉ khi kind = FORM): danh sách test case và bug report. */
  @Prop({ type: Object })
  formData?: object;

  @Prop({ type: Array, default: [] })
  rubricGrades: RubricGrade[];

  @Prop({ type: String, default: '' })
  reviewerNotes: string;

  @Prop({ type: String })
  reviewerId?: string;

  @Prop({
    type: String,
    enum: ['SUBMITTED', 'REVIEWED'],
    default: 'SUBMITTED',
  })
  status: SubmissionStatus;

  /** Điểm đã chốt chính thức: giảng viên không sửa được qua API, muốn chấm lại phải qua luồng phúc khảo. */
  @Prop({ type: Boolean, default: false })
  isFinalized: boolean;

  @Prop({ type: Date })
  finalizedAt?: Date;

  @Prop({ type: Object })
  reopenRequest?: ReopenRequest;

  /** Kết quả đã bị hủy (kèm lý do, có ghi audit log). */
  @Prop({ type: Boolean, default: false })
  invalidated: boolean;

  @Prop({ type: String })
  invalidReason?: string;
}

/** Yêu cầu mở phúc khảo cho bài đã chốt điểm; chỉ Admin duyệt (mở khóa) được. */
export interface ReopenRequest {
  requestedBy: string;
  reason: string;
  at: Date;
}

export const TesterLabSubmissionSchema =
  SchemaFactory.createForClass(TesterLabSubmission);
