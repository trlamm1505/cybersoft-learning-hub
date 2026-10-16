import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TesterLabSubmissionDocument = TesterLabSubmission & Document;

export type SubmissionStatus = 'SUBMITTED' | 'REVIEWED';

export interface AutoCheckResult {
  check: string;
  passed: boolean;
  message: string;
}

export interface RubricGrade {
  key: string;
  score: number;
  note?: string;
}

@Schema({ timestamps: true, collection: 'tester_lab_submissions' })
export class TesterLabSubmission {
  @Prop({ required: true, type: Types.ObjectId, ref: 'TesterLab', index: true })
  labId: Types.ObjectId;

  @Prop({ required: true, type: String, index: true })
  userId: string;

  /** Đường dẫn tương đối của file trong uploads/tester-labs. */
  @Prop({ required: true, type: String })
  artifactUrl: string;

  @Prop({ required: true, type: String })
  fileType: string;

  @Prop({ required: true, type: Number })
  fileSize: number;

  @Prop({ type: Array, default: [] })
  autoCheckResults: AutoCheckResult[];

  @Prop({ type: Array, default: [] })
  rubricGrades: RubricGrade[];

  @Prop({ type: String, default: '' })
  reviewerNotes: string;

  @Prop({ type: String })
  reviewerId?: string;

  @Prop({
    type: String,
    enum: ['SUBMITTED', 'REVIEWED'],
    default: 'SUBMITTED',
  })
  status: SubmissionStatus;
}

export const TesterLabSubmissionSchema =
  SchemaFactory.createForClass(TesterLabSubmission);
