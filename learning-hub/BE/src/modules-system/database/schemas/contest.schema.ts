import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContestDocument = Contest & Document;

@Schema({ _id: false })
export class ContestProblem {
  @Prop({ type: String })
  lessonId?: string;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  slug: string;

  @Prop({ type: String, enum: ['coding', 'quiz'], default: 'coding' })
  type: 'coding' | 'quiz';

  @Prop({ type: Number, default: 100 })
  points: number;

  @Prop({ type: Number, default: 1 })
  order: number;
}

export const ContestProblemSchema = SchemaFactory.createForClass(ContestProblem);

@Schema({ _id: false })
export class ContestRegistration {
  @Prop({ required: true, type: String })
  studentId: string;

  @Prop({ type: String, default: 'Học viên' })
  studentName?: string;

  @Prop({ type: Date, default: Date.now })
  registeredAt: Date;
}

export const ContestRegistrationSchema = SchemaFactory.createForClass(ContestRegistration);

@Schema({ timestamps: true, collection: 'contests' })
export class Contest {
  @Prop({ required: true, type: String, trim: true })
  title: string;

  @Prop({ required: true, type: String, unique: true, trim: true })
  slug: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ required: true, type: Date })
  startTime: Date;

  @Prop({ required: true, type: Date })
  endTime: Date;

  @Prop({ type: Number, default: 90 })
  durationMinutes: number;

  @Prop({ type: [ContestProblemSchema], default: [] })
  problems: ContestProblem[];

  @Prop({ type: [ContestRegistrationSchema], default: [] })
  registrations: ContestRegistration[];

  @Prop({ type: String, enum: ['draft', 'published'], default: 'published' })
  status: 'draft' | 'published';

  @Prop({ type: String, default: 'teacher-1' })
  authorId: string;
}

export const ContestSchema = SchemaFactory.createForClass(Contest);
