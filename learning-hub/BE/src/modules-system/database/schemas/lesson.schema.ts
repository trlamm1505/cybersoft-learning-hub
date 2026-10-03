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

export const LessonTestCaseSchema =
  SchemaFactory.createForClass(LessonTestCase);

@Schema({ _id: false })
export class QuizQuestionOption {
  @Prop({ required: true, type: String })
  key: string;

  @Prop({ required: true, type: String })
  text: string;

  @Prop({ required: true, type: Boolean, default: false })
  isCorrect: boolean;
}

export const QuizQuestionOptionSchema =
  SchemaFactory.createForClass(QuizQuestionOption);

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

@Schema({ _id: false })
export class BlockCommand {
  @Prop({ required: true, type: String })
  key: string; // 'MOVE_FORWARD' | 'TURN_LEFT' | 'TURN_RIGHT' | 'REPEAT' | 'IF_OBSTACLE'

  @Prop({ required: true, type: String })
  label: string;

  @Prop({ type: String })
  icon?: string;
}

export const BlockCommandSchema = SchemaFactory.createForClass(BlockCommand);

@Schema({ _id: false })
export class BlockPosition {
  @Prop({ required: true, type: Number })
  x: number;

  @Prop({ required: true, type: Number })
  y: number;
}

export const BlockPositionSchema = SchemaFactory.createForClass(BlockPosition);

@Schema({ _id: false })
export class BlockStartPosition extends BlockPosition {
  @Prop({ required: true, type: String, enum: ['UP', 'DOWN', 'LEFT', 'RIGHT'] })
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
}

export const BlockStartPositionSchema =
  SchemaFactory.createForClass(BlockStartPosition);

@Schema({ _id: false })
export class BlockPuzzleConfig {
  // Định danh game (ví dụ 'robot-ve-nha') — dùng để nhóm nhiều bài "ải" vào
  // cùng một game trên màn hình chọn game của Block Puzzle. Nhiều bài khác
  // nhau có thể chia sẻ cùng gameId để xuất hiện chung một thẻ game.
  @Prop({ required: true, type: String, default: 'robot-ve-nha' })
  gameId: string;

  // Tên game hiển thị trên thẻ chọn game (ví dụ 'Robot Về Nhà') — tách khỏi
  // title của từng bài riêng lẻ (ví dụ 'Robot Về Nhà - Bài 1: Đường Thẳng').
  @Prop({ required: true, type: String, default: 'Robot Về Nhà' })
  gameTitle: string;

  @Prop({ type: String, default: '' })
  storyText: string;

  @Prop({ required: true, type: Number })
  gridWidth: number;

  @Prop({ required: true, type: Number })
  gridHeight: number;

  @Prop({ required: true, type: BlockStartPositionSchema })
  startPosition: BlockStartPosition;

  @Prop({ required: true, type: BlockPositionSchema })
  goalPosition: BlockPosition;

  @Prop({ type: [BlockPositionSchema], default: [] })
  obstacles: BlockPosition[];

  @Prop({ type: [BlockCommandSchema], default: [] })
  availableBlocks: BlockCommand[];

  @Prop({ type: Number, default: 10 })
  maxBlocks: number;

  @Prop({
    required: true,
    type: String,
    enum: ['sequence', 'loop', 'condition'],
  })
  concept: 'sequence' | 'loop' | 'condition';

  @Prop({ type: String, default: '' })
  successMessage: string;

  @Prop({ required: true, type: Number })
  order: number;
}

export const BlockPuzzleConfigSchema =
  SchemaFactory.createForClass(BlockPuzzleConfig);

@Schema({ timestamps: true, collection: 'lessons' })
export class Lesson {
  @Prop({ required: true, type: String, trim: true })
  title: string;

  @Prop({ required: true, type: String, unique: true, trim: true })
  slug: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({
    required: true,
    type: String,
    enum: ['coding', 'quiz', 'block'],
    default: 'coding',
  })
  type: 'coding' | 'quiz' | 'block';

  @Prop({
    required: true,
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  })
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

  @Prop({ type: BlockPuzzleConfigSchema })
  blockPuzzle?: BlockPuzzleConfig;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);
