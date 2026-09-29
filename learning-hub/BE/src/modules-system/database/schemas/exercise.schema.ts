import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { LessonHints, LessonHintsSchema } from './lesson.schema';

export type ExerciseDocument = Exercise & Document;

@Schema({ _id: false })
export class ExerciseTestCase {
  @Prop({ required: true, type: String })
  input: string;

  // Not `required: true`: Mongoose's default String required-check treats '' as
  // missing, but '' is a legitimate expected output (e.g. "print nothing" cases).
  @Prop({ type: String })
  expectedOutput: string;

  @Prop({ type: Boolean, default: false })
  isHidden: boolean;

  @Prop({ type: Number })
  memoryLimitMb?: number;
}

export const ExerciseTestCaseSchema =
  SchemaFactory.createForClass(ExerciseTestCase);

@Schema({ timestamps: true, collection: 'exercises' })
export class Exercise {
  @Prop({ required: true, type: String, trim: true })
  title: string;

  @Prop({ required: true, type: String, unique: true })
  slug: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({
    type: String,
    enum: ['QUIZ', 'CODE_BLOCK', 'CODE_TEXT', 'SQL_LAB'],
    default: 'CODE_TEXT',
  })
  type: string;

  @Prop({ type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'EASY' })
  difficulty: string;

  @Prop({ type: Number, default: 10 })
  points: number;

  @Prop({ type: String, default: '' })
  starterCode: string;

  @Prop({ type: String })
  solutionCode?: string;

  @Prop({ type: Number, default: 2000 })
  timeLimitMs: number;

  @Prop({ type: Number, default: 128 })
  memoryLimitMb: number;

  @Prop({ type: [ExerciseTestCaseSchema], default: [] })
  testCases: ExerciseTestCase[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: String })
  prerequisiteSlug?: string;

  // Grade band this exercise targets ('3-5' | '6-9' | '9-12', ...). Lets the UI
  // filter the catalog by class level instead of showing every exercise flat.
  @Prop({ type: String })
  gradeBand?: string;

  // Name of the game/topic pack this exercise belongs to within its grade band
  // (e.g. 'python-fundamentals', 'robot-ve-nha'). A grade band can hold several
  // topics side by side, each with its own difficulty progression.
  @Prop({ type: String })
  topic?: string;

  // 1-based position within its topic, for ordering the progression on screen
  // independent of insertion order or slug naming.
  @Prop({ type: Number })
  orderInTopic?: number;

  @Prop({ type: LessonHintsSchema })
  hints?: LessonHints;

  // Slug của Lesson (Teacher Authoring) đã tạo/đồng bộ bản ghi exercise này,
  // set DUY NHẤT bởi AuthoringService.syncPublishedCodingLessonToExerciseBank.
  // Dùng để phân biệt "exercise thuộc sở hữu của lesson này, an toàn để
  // lesson tự cập nhật lại" với "exercise có cùng slug nhưng do nguồn khác
  // tạo (AI Tạo Đề lưu trực tiếp qua saveDraft, hoặc import thủ công)" —
  // undefined/không khớp lesson.slug nghĩa là KHÔNG được ghi đè âm thầm.
  @Prop({ type: String })
  sourceLessonSlug?: string;

  // Audit trail cho cơ chế human-in-the-loop khi lưu đè cảnh báo trùng lặp
  // MỀM (xem ProblemGeneratorService.saveDraft, forceSave). Chỉ set khi bài
  // được lưu qua forceSave=true trong khi vẫn còn duplicateCandidates chưa
  // xử lý — giúp người vận hành sau này lọc ra các bài "đã bị giáo viên bỏ
  // qua cảnh báo" để rà soát lại nếu cần, không xoá dấu vết như ghi đè âm
  // thầm thông thường.
  @Prop({ type: Boolean, default: false })
  hasDuplicateWarning?: boolean;

  @Prop({ type: String })
  approvedBy?: string;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: String })
  overrideReason?: string;
}

export const ExerciseSchema = SchemaFactory.createForClass(Exercise);
