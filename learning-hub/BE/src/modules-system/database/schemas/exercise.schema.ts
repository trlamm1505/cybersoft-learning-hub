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
}

export const ExerciseSchema = SchemaFactory.createForClass(Exercise);
