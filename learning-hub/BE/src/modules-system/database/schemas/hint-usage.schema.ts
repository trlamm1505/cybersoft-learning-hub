import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HintUsageDocument = HintUsage & Document;

@Schema({ timestamps: true, collection: 'hint_usages' })
export class HintUsage {
  @Prop({ required: true, type: String, index: true })
  userId: string;

  @Prop({ required: true, type: String, index: true })
  exerciseSlug: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Hint' })
  hintId: Types.ObjectId;

  @Prop({ required: true, type: Number, enum: [1, 2, 3] })
  level: number;

  @Prop({ type: Date, default: Date.now })
  unlockedAt: Date;

  @Prop({ type: Number, default: 0 })
  costPoints: number;
}

export const HintUsageSchema = SchemaFactory.createForClass(HintUsage);

// Compound index for efficient user-exercise usage lookup
HintUsageSchema.index({ userId: 1, exerciseSlug: 1 });
