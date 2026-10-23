import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RevokedTokenDocument = RevokedToken & Document;

/**
 * Token đã đăng xuất (Day 29, L3): lưu bền `jti` để token bị thu hồi vẫn bị từ chối sau khi backend khởi động lại hoặc
 * khi chạy nhiều instance. MongoDB tự xóa bản ghi đúng lúc token hết hạn (TTL trên expiresAt), nên bảng không phình.
 */
@Schema({ collection: 'revoked_tokens' })
export class RevokedToken {
  @Prop({ required: true, type: String, unique: true })
  jti: string;

  @Prop({ required: true, type: Date })
  expiresAt: Date;
}

export const RevokedTokenSchema = SchemaFactory.createForClass(RevokedToken);
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
