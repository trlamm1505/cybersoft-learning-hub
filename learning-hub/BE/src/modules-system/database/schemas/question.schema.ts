import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema({ _id: false })
export class QuestionOption {
  @Prop({ required: true, type: String })
  key: string; // e.g. 'A', 'B', 'C', 'D'

  @Prop({ required: true, type: String })
  text: string; // Content of the option

  @Prop({ required: true, type: Boolean, default: false })
  isCorrect: boolean; // True if this option is correct
}

export const QuestionOptionSchema =
  SchemaFactory.createForClass(QuestionOption);

@Schema({ timestamps: true, collection: 'questions' })
export class Question {
  @Prop({ required: true, type: String, trim: true })
  content: string; // Question content text

  @Prop({ type: String })
  codeSnippet?: string; // Optional code snippet block

  @Prop({ type: [QuestionOptionSchema], required: true })
  options: QuestionOption[]; // Array of choices (A, B, C, D)

  @Prop({ required: true, type: String })
  explanation: string; // Detailed pedagogical explanation of the answer

  @Prop({ type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' })
  difficulty: string; // Difficulty level

  @Prop({ type: String, default: 'General' })
  category: string; // Category e.g. HTML5, CSS3, JavaScript, React, NestJS, Database

  @Prop({ type: Number, default: 10 })
  points: number; // Point value for this question

  @Prop({ type: [String], default: [] })
  tags: string[]; // Topic tags

  // Khối lớp dùng câu này để ôn tập ('6-9' | '10-12'). Thiếu = hiện cho mọi khối (dữ liệu cũ).
  @Prop({ type: [String], enum: ['6-9', '10-12'], default: undefined, index: true })
  gradeBands?: string[];

  /**
   * Câu do giảng viên soạn trong Ngân hàng đề (Day 30): CHỈ dùng cho bài giao của lớp (Ngày 1..5) và đề cuộc thi,
   * không xuất hiện ở trang /quiz tự luyện công khai.
   */
  @Prop({ type: Boolean, index: true })
  bankOnly?: boolean;

  /** Giảng viên soạn câu (sub trong token); câu hệ thống không có. */
  @Prop({ type: String, index: true })
  authorId?: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
