import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContestSubmissionDocument = ContestSubmission & Document;

export type ContestSubmissionVerdict = 'AC' | 'WA' | 'PARTIAL' | 'CE' | 'TLE' | 'RE';

@Schema({ timestamps: true, collection: 'contest_submissions' })
export class ContestSubmission {
  @Prop({ required: true, type: String, index: true })
  contestId: string;

  @Prop({ required: true, type: String, index: true })
  problemSlug: string;

  @Prop({ required: true, type: String, enum: ['coding', 'quiz'] })
  problemType: 'coding' | 'quiz';

  @Prop({ required: true, type: String, index: true })
  studentId: string;

  @Prop({ type: String, default: 'Học viên' })
  studentName?: string;

  // Private — never returned by the leaderboard API.
  @Prop({ type: String })
  code?: string;

  // Private — never returned by the leaderboard API.
  @Prop({ type: Object })
  quizAnswers?: Record<string, string>;

  @Prop({ required: true, type: Number, default: 0 })
  score: number;

  @Prop({ required: true, type: Number })
  maxPoints: number;

  @Prop({ required: true, type: String, enum: ['AC', 'WA', 'PARTIAL', 'CE', 'TLE', 'RE'] })
  verdict: ContestSubmissionVerdict;

  @Prop({ type: Number, default: 0 })
  passedCount?: number;

  @Prop({ type: Number, default: 0 })
  totalCount?: number;

  @Prop({ required: true, type: Date })
  submittedAt: Date;

  @Prop({ required: true, type: Boolean, default: false })
  isLate: boolean;
}

export const ContestSubmissionSchema = SchemaFactory.createForClass(ContestSubmission);

// Leaderboard's core query is "for a contest, group by (studentId, problemSlug), take the
// max score" — this compound index supports that grouping+sort directly.
ContestSubmissionSchema.index({ contestId: 1, studentId: 1, problemSlug: 1, score: -1 });
// Supports the frozen-leaderboard cutoff filter (`submittedAt <= freezeAt`).
ContestSubmissionSchema.index({ contestId: 1, submittedAt: 1 });
