import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CourseCertificateDocument = CourseCertificate & Document;

/**
 * Chứng chỉ hoàn thành khóa học ĐÃ CẤP, bất biến: gắn liền với (học viên, khóa học). Sau khi cấp, mã, ngày cấp, điểm và xếp loại
 * được chốt lại; dù giảng viên thêm bài lab mới vào khóa sau này, chứng chỉ đã cấp vẫn giữ nguyên. Chỉ ghi khi chưa có
 * (upsert $setOnInsert), không có luồng nào cập nhật hay xóa trong ứng dụng.
 */
@Schema({ timestamps: true, collection: 'course_certificates' })
export class CourseCertificate {
  @Prop({ required: true, type: String, index: true })
  userId: string;

  /** Mã khóa học (vd 'tester-qa', 'data-sql', 'ai-prompt'). */
  @Prop({ required: true, type: String })
  courseKey: string;

  @Prop({ required: true, type: String })
  studentName: string;

  @Prop({ required: true, type: String })
  courseTitle: string;

  @Prop({ type: String })
  teacherName?: string;

  @Prop({ required: true, type: Number })
  finalScore: number;

  @Prop({ required: true, type: Number })
  earned: number;

  @Prop({ required: true, type: Number })
  max: number;

  @Prop({ required: true, type: String, enum: ['Xuất sắc', 'Giỏi', 'Khá'] })
  grade: string;

  /** Ngày cấp = thời điểm khóa được hoàn thành lần đầu. */
  @Prop({ required: true, type: Date })
  completedAt: Date;

  @Prop({ required: true, type: String, unique: true })
  code: string;
}

export const CourseCertificateSchema = SchemaFactory.createForClass(CourseCertificate);
CourseCertificateSchema.index({ userId: 1, courseKey: 1 }, { unique: true });
