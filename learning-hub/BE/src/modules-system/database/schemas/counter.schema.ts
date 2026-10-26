import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CounterDocument = Counter & Document;

/**
 * Bộ đếm tuần tự dùng chung cho các mã tự tăng (hiện tại: mã học viên
 * Cxxxx). Dùng `findOneAndUpdate` với `$inc` — atomic ở tầng MongoDB — để
 * hai lượt đăng ký đồng thời không bao giờ nhận trùng số thứ tự, khác với
 * việc đếm `countDocuments({role: 'STUDENT'})` rồi +1 (có race condition
 * thật giữa lúc đếm và lúc ghi).
 */
@Schema({ collection: 'counters' })
export class Counter {
  @Prop({ required: true, type: String, unique: true })
  key: string; // ví dụ 'studentCode'

  @Prop({ required: true, type: Number, default: 0 })
  seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
