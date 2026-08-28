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

export const QuestionOptionSchema = SchemaFactory.createForClass(QuestionOption);

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
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
