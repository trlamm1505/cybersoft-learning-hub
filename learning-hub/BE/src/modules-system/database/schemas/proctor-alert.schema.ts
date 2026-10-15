import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProctorAlertDocument = ProctorAlert & Document;

export type ProctorAlertKind = 'CONTEST' | 'CLASS_ASSIGNMENT';
export type ProctorAlertSeverity = 'INFO' | 'WARNING' | 'LOCKED';
export type ProctorAlertStatus = 'OPEN' | 'ACKNOWLEDGED';

/**
 * Cảnh báo "rời màn hình làm bài" gửi giảng viên. Mỗi (loại, học viên, bài/cuộc thi) một
 * bản ghi, `leaveCount` do SERVER đếm. Chỉ để giảng viên xem xét, không bao giờ đổi điểm.
 */
@Schema({ timestamps: true, collection: 'proctor_alerts' })
export class ProctorAlert {
  @Prop({ required: true, type: String, enum: ['CONTEST', 'CLASS_ASSIGNMENT'] })
  kind: ProctorAlertKind;

  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ type: String, default: 'Học viên' })
  studentName: string;

  /** Id cuộc thi hoặc id bài được giao. */
  @Prop({ required: true, type: String })
  refId: string;

  @Prop({ type: String, default: '' })
  refTitle: string;

  @Prop({ type: String })
  classId?: string;

  @Prop({ type: String })
  className?: string;

  /** Giảng viên phụ trách lớp (bài lớp). Cuộc thi để trống: mọi giảng viên đều thấy. */
  @Prop({ type: String, index: true })
  teacherId?: string;

  @Prop({ type: Number, default: 0 })
  leaveCount: number;

  @Prop({ type: String, enum: ['INFO', 'WARNING', 'LOCKED'], default: 'INFO' })
  severity: ProctorAlertSeverity;

  @Prop({ type: String, default: '' })
  message: string;

  @Prop({ type: String, enum: ['OPEN', 'ACKNOWLEDGED'], default: 'OPEN' })
  status: ProctorAlertStatus;

  @Prop({ type: Date })
  lastLeaveAt?: Date;

  @Prop({ type: String })
  acknowledgedBy?: string;

  @Prop({ type: Date })
  acknowledgedAt?: Date;
}

export const ProctorAlertSchema = SchemaFactory.createForClass(ProctorAlert);
ProctorAlertSchema.index({ kind: 1, userId: 1, refId: 1 }, { unique: true });
ProctorAlertSchema.index({ status: 1, updatedAt: -1 });
