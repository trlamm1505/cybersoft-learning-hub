import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PasswordResetDocument = PasswordReset & Document;

/**
 * Token reset mật khẩu — tách khỏi User collection để không phải thêm field
 * tạm thời vào bản ghi người dùng chính, và để một user có thể có nhiều
 * request quên mật khẩu chồng nhau (request sau làm request trước hết hiệu
 * lực — xem AuthService.forgotPassword).
 *
 * `tokenHash` lưu SHA-256 của token gửi qua email, KHÔNG lưu token gốc — nếu
 * DB bị lộ, kẻ tấn công vẫn không tự tạo được token hợp lệ từ hash (giống
 * cách password không lưu plaintext).
 */
@Schema({ timestamps: true, collection: 'password_resets' })
export class PasswordReset {
  @Prop({ required: true, type: String, index: true })
  userId: string;

  @Prop({ required: true, type: String, unique: true })
  tokenHash: string;

  @Prop({ required: true, type: Date })
  expiresAt: Date;

  @Prop({ type: Boolean, default: false })
  used: boolean;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);

// TTL index: Mongo tự xóa document sau khi expiresAt trôi qua — không cần
// cron job dọn rác token hết hạn.
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
