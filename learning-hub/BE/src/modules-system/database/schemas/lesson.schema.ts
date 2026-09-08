import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LessonDocument = Lesson & Document;

@Schema({ _id: false })
export class LessonTestCase {
  @Prop({ required: true, type: String })
  input: string;

  @Prop({ required: true, type: String })
  expectedOutput: string;

  @Prop({ type: Boolean, default: false })
  isHidden?: boolean;
}

export const LessonTestCaseSchema = SchemaFactory.createForClass(LessonTestCase);

@Schema({ _id: false })
export class QuizQuestionOption {
  @Prop({ required: true, type: String })
  key: string;

  @Prop({ required: true, type: String })
  text: string;

  @Prop({ required: true, type: Boolean, default: false })
  isCorrect: boolean;
}

export const QuizQuestionOptionSchema = SchemaFactory.createForClass(QuizQuestionOption);

@Schema({ _id: false })
export class QuizQuestion {
  @Prop({ required: true, type: String })
  content: string;

  @Prop({ type: String })
  codeSnippet?: string;

  @Prop({ type: [QuizQuestionOptionSchema], required: true, default: [] })
  options: QuizQuestionOption[];

  @Prop({ type: String, default: '' })
  explanation?: string;

  @Prop({ type: Number, default: 10 })
  points?: number;
}

export const QuizQuestionSchema = SchemaFactory.createForClass(QuizQuestion);

@Schema({ _id: false })
export class LessonHints {
  @Prop({ type: String, default: '' })
  hint1: string;

  @Prop({ type: String, default: '' })
  hint2: string;

  @Prop({ type: String, default: '' })
  hint3: string;
}

export const LessonHintsSchema = SchemaFactory.createForClass(LessonHints);

@Schema({ timestamps: true, collection: 'lessons' })
export class Lesson {
  @Prop({ required: true, type: String, trim: true })
  title: string;

  @Prop({ required: true, type: String, unique: true, trim: true })
  slug: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ required: true, type: String, enum: ['coding', 'quiz'], default: 'coding' })
  type: 'coding' | 'quiz';

  @Prop({ required: true, type: String, enum: ['draft', 'published'], default: 'draft' })
  status: 'draft' | 'published';

  @Prop({ type: String, default: '' })
  learningOutcome: string;

  @Prop({ type: String, default: '' })
  content: string;

  @Prop({ type: String, default: '' })
  starterCode: string;

  @Prop({ type: String, default: '' })
  solutionCode: string;

  @Prop({ type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'EASY' })
  difficulty: string;

  @Prop({ type: Number, default: 10 })
  points: number;

  @Prop({ type: String, default: 'teacher-1' })
  authorId: string;

  @Prop({ type: [LessonTestCaseSchema], default: [] })
  testCases: LessonTestCase[];

  @Prop({ type: [QuizQuestionSchema], default: [] })
  quizQuestions: QuizQuestion[];

  @Prop({ type: LessonHintsSchema, default: {} })
  hints?: LessonHints;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);
