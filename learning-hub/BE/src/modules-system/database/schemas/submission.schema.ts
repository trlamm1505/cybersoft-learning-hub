import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubmissionDocument = Submission & Document;

@Schema({ _id: false })
export class SubmissionTestResult {
  @Prop({ type: Number, required: true })
  index: number;

  @Prop({ type: Boolean, required: true })
  passed: boolean;

  @Prop({ type: Boolean, default: false })
  isHidden: boolean;

  @Prop({ type: String })
  input?: string;

  @Prop({ type: String })
  expectedOutput?: string;

  @Prop({ type: String })
  actualOutput?: string;

  @Prop({ type: String })
  stderr?: string;

  @Prop({ type: Number })
  executionTimeMs?: number;

  @Prop({ type: Number })
  memoryUsedMb?: number;
}

export const SubmissionTestResultSchema = SchemaFactory.createForClass(SubmissionTestResult);

@Schema({ timestamps: true, collection: 'submissions' })
export class Submission {
  @Prop({ required: true, type: String })
  exerciseId: string;

  @Prop({ type: String })
  userId?: string;

  @Prop({ required: true, type: String })
  code: string;

  @Prop({
    type: String,
    enum: ['QUEUED', 'RUNNING', 'AC', 'WA', 'TLE', 'RE', 'CE', 'FAILED'],
    default: 'QUEUED',
  })
  status: string;

  @Prop({ type: Number, default: 0 })
  passedCount: number;

  @Prop({ type: Number, default: 0 })
  totalCount: number;

  @Prop({ type: [SubmissionTestResultSchema], default: [] })
  results: SubmissionTestResult[];

  @Prop({ type: String })
  errorMessage?: string;

  @Prop({ type: String, index: true, sparse: true, unique: true })
  idempotencyKey?: string;

  @Prop({ type: Number })
  memoryUsedMb?: number;

  @Prop({ type: Number, default: 0 })
  attempts: number;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
