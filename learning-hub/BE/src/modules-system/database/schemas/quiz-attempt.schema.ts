import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizAttemptDocument = QuizAttempt & Document;

@Schema({ _id: false })
export class ShuffledQuestionItem {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId: Types.ObjectId;

  @Prop({ type: [String], required: true })
  optionKeysOrder: string[]; // Shuffled order of option keys, e.g. ['C', 'A', 'D', 'B']

  @Prop({ type: String })
  selectedOptionKey?: string; // Student's chosen option key (e.g. 'B')

  @Prop({ type: Boolean })
  isCorrect?: boolean; // Auto-graded correctness

  @Prop({ type: Number, default: 0 })
  scoreEarned?: number; // Score achieved for this question
}

export const ShuffledQuestionItemSchema = SchemaFactory.createForClass(ShuffledQuestionItem);

@Schema({ timestamps: true, collection: 'quizattempts' })
export class QuizAttempt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Test', required: true })
  testId: Types.ObjectId;

  @Prop({ type: String, required: true })
  seed: string; // Seed string/number used for deterministic shuffle of questions & options

  @Prop({ type: [ShuffledQuestionItemSchema], required: true })
  shuffledQuestions: ShuffledQuestionItem[]; // Array of shuffled questions and student responses

  @Prop({ type: Date, default: Date.now })
  startedAt: Date; // Quiz start timestamp

  @Prop({ type: Number, default: 1800 })
  timeLimitSeconds: number; // Time limit in seconds (default 30 mins)

  @Prop({ type: Date })
  submittedAt?: Date; // Actual submission timestamp

  @Prop({
    type: String,
    enum: ['IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'GRADED'],
    default: 'IN_PROGRESS'
  })
  status: string; // Attempt state

  @Prop({ type: Number, default: 0 })
  score: number; // Achieved total score

  @Prop({ type: Number, default: 100 })
  maxScore: number; // Maximum possible score
}

export const QuizAttemptSchema = SchemaFactory.createForClass(QuizAttempt);
