import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClassroomDocument = Classroom & Document;

/**
 * Lớp học của một giảng viên: tập học viên và tập bài tập được giao. Mọi số liệu
 * Teacher Dashboard chỉ tính trong phạm vi hai tập này nên dữ liệu các lớp không lẫn nhau.
 */
@Schema({ timestamps: true, collection: 'classrooms' })
export class Classroom {
  @Prop({ required: true, type: String, trim: true })
  name: string;

  @Prop({ type: String, default: '', trim: true })
  description: string;

  /** Lớp lưu trữ: ẩn khỏi Dashboard mặc định nhưng giữ nguyên dữ liệu. */
  @Prop({ type: Boolean, default: false })
  archived: boolean;

  /** Giảng viên sở hữu lớp (userId dạng chuỗi, cùng quy ước với Submission.userId). */
  @Prop({ required: true, type: String, index: true })
  teacherId: string;

  @Prop({ type: [String], default: [] })
  studentIds: string[];

  /** Slug các bài tập được giao cho lớp. */
  @Prop({ type: [String], default: [] })
  exerciseSlugs: string[];
}

export const ClassroomSchema = SchemaFactory.createForClass(Classroom);
