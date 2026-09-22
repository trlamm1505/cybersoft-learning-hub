import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CoachMessageDocument = CoachMessage & Document;

// Lịch sử hội thoại AI Coach, dùng cho context (câu hỏi trước đó) và logging
// bắt buộc theo điều kiện nghiệm thu (có logging + giới hạn token).
@Schema({ timestamps: true, collection: 'coach_messages' })
export class CoachMessage {
  @Prop({ required: true, type: String, index: true })
  userId: string;

  @Prop({ required: true, type: String, index: true })
  exerciseSlug: string;

  @Prop({ required: true, type: String, enum: ['user', 'assistant'] })
  role: string;

  @Prop({ required: true, type: String })
  content: string;

  // Ước lượng số token của message này (input hoặc output), phục vụ giới hạn
  // token theo phiên và theo lượt gọi.
  @Prop({ required: true, type: Number, default: 0 })
  tokenCount: number;

  // Chỉ có ở message role 'assistant': đánh dấu response có bị policy chặn/
  // viết lại hay không, và lý do — phục vụ audit "AI không đưa full solution".
  @Prop({ type: Boolean, default: false })
  policyBlocked: boolean;

  @Prop({ type: String })
  policyReason?: string;
}

export const CoachMessageSchema = SchemaFactory.createForClass(CoachMessage);

CoachMessageSchema.index({ userId: 1, exerciseSlug: 1, createdAt: 1 });
