import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClassAssignmentDocument = ClassAssignment & Document;

/**
 * Bài được giao cho một lớp, có thời gian mở và hạn chót. Có hai loại:
 *  - CODING: một bài Python trong ngân hàng bài tập (exerciseSlug);
 *  - QUIZ: một đề trắc nghiệm gồm các câu chọn sẵn (questionIds).
 * Điểm của học viên chỉ tính từ bài nộp/lượt thi mang đúng assignmentId (luyện tập tự do ở Playground thì không tính).
 */
@Schema({ timestamps: true, collection: 'class_assignments' })
export class ClassAssignment {
  @Prop({ required: true, type: String, index: true })
  classId: string;

  @Prop({ required: true, type: String, enum: ['CODING', 'QUIZ'] })
  type: 'CODING' | 'QUIZ';

  @Prop({ required: true, type: String, trim: true })
  title: string;

  /** Bài CODING: slug bài trong ngân hàng bài tập. */
  @Prop({ type: String })
  exerciseSlug?: string;

  /** Bài QUIZ: id các câu hỏi trong ngân hàng câu hỏi. */
  @Prop({ type: [String], default: undefined })
  questionIds?: string[];

  /** Tổng điểm của bài; mỗi lần nộp sai (WA/TLE/RE) trước khi đạt AC bị trừ 1 điểm (không xuống dưới 0). */
  @Prop({ type: Number, default: 10, min: 1, max: 100 })
  maxPoints: number;

  @Prop({ required: true, type: Date })
  startAt: Date;

  @Prop({ required: true, type: Date })
  dueAt: Date;

  @Prop({ type: Number, default: 1 })
  order: number;

  /** Giảng viên tạo bài (userId dạng chuỗi). */
  @Prop({ type: String })
  createdBy?: string;
}

export const ClassAssignmentSchema = SchemaFactory.createForClass(ClassAssignment);
ClassAssignmentSchema.index({ classId: 1, startAt: 1, order: 1 });
