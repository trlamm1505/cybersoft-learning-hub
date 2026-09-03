import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExerciseDocument = Exercise & Document;

@Schema({ _id: false })
export class ExerciseTestCase {
  @Prop({ required: true, type: String })
  input: string;

  @Prop({ required: true, type: String })
  expectedOutput: string;

  @Prop({ type: Boolean, default: false })
  isHidden: boolean;
}

export const ExerciseTestCaseSchema = SchemaFactory.createForClass(ExerciseTestCase);

@Schema({ timestamps: true, collection: 'exercises' })
export class Exercise {
  @Prop({ required: true, type: String, trim: true })
  title: string;

  @Prop({ required: true, type: String, unique: true })
  slug: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ type: String, enum: ['QUIZ', 'CODE_BLOCK', 'CODE_TEXT', 'SQL_LAB'], default: 'CODE_TEXT' })
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
}

export const ExerciseSchema = SchemaFactory.createForClass(Exercise);
