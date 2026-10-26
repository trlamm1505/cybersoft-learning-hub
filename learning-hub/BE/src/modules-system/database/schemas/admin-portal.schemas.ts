import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import { Document } from 'mongoose';

// ---------------------------------------------------------------------------------------------
// SystemConfigs: cấu hình hệ thống do Admin quản lý (API key đã mã hóa, system prompt của AI).
// ---------------------------------------------------------------------------------------------
export type SystemConfigDocument = SystemConfig & Document;

export type SystemConfigCategory = 'AI_KEY' | 'AI_PROMPT';

@Schema({ timestamps: { createdAt: false, updatedAt: true }, collection: 'system_configs' })
export class SystemConfig {
  @Prop({ required: true, unique: true, type: String })
  key: string;

  /** Giá trị. Với khóa bí mật (AI_KEY) đây là chuỗi đã mã hóa AES-256-GCM (iv.tag.ciphertext, base64url), không bao giờ là bản rõ. */
  @Prop({ required: true, type: String })
  value: string;

  @Prop({ required: true, type: String, enum: ['AI_KEY', 'AI_PROMPT'] })
  category: SystemConfigCategory;

  @Prop({ type: Boolean, default: false })
  encrypted: boolean;

  @Prop({ type: Date })
  updatedAt?: Date;

  /** Id Admin sửa gần nhất. */
  @Prop({ type: String })
  updatedBy?: string;
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);

// ---------------------------------------------------------------------------------------------
// audit_logs: nhật ký thao tác nhạy cảm của Admin. Chỉ thêm, không sửa, không xóa.
// ---------------------------------------------------------------------------------------------
export type AuditLogDocument = AuditLog & Document;

export const AUDIT_ACTIONS = [
  'USER_LOCK',
  'USER_UNLOCK',
  'USER_CREATE',
  'USER_UPDATE',
  'ROLE_CHANGE',
  'CLASS_ASSIGN',
  'CLASS_ARCHIVE',
  'CLASS_CREATE',
  'CLASS_UPDATE',
  'CLASS_DELETE',
  'STUDENT_ADD',
  'STUDENT_REMOVE',
  'CONFIG_UPDATE',
  'BULK_LOCK',
  'BULK_UNLOCK',
  'SUBMISSION_INVALIDATE',
  'SUBMISSION_FINALIZE',
  'SUBMISSION_REVIEW_REQUEST',
  'CONTEST_DISQUALIFY',
  'CONTEST_REINSTATE',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditTargetType = 'USER' | 'CLASS' | 'CONFIG' | 'SUBMISSION' | 'CONTEST_ATTEMPT';

@Schema({ collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true, type: String, index: true })
  actorId: string;

  @Prop({ required: true, type: String, index: true })
  actorEmail: string;

  @Prop({ required: true, type: String, enum: AUDIT_ACTIONS, index: true })
  action: AuditAction;

  @Prop({ required: true, type: String, enum: ['USER', 'CLASS', 'CONFIG', 'SUBMISSION', 'CONTEST_ATTEMPT'] })
  targetType: AuditTargetType;

  @Prop({ required: true, type: String })
  targetId: string;

  /** Trước/sau khi đổi. Giá trị bí mật (API key) luôn được che trước khi ghi. */
  @Prop({ type: Object, default: {} })
  diff: { before: unknown; after: unknown };

  /** Lý do (bắt buộc với hủy kết quả bài nộp, từ 10 ký tự). */
  @Prop({ type: String })
  reason?: string;

  /** Chuỗi băm: hash = SHA256(previousHash + actorId + action + targetId + timestamp). Sửa/xóa một bản ghi làm đứt chuỗi. */
  @Prop({ type: String, default: '' })
  previousHash?: string;

  @Prop({ type: String, index: true })
  hash?: string;

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ timestamp: -1 });

/** Hash của một bản ghi audit; timestamp luôn ở dạng ISO để tính lại được khi kiểm tra. */
export function computeAuditHash(previousHash: string, actorId: string, action: string, targetId: string, timestamp: Date): string {
  return createHash('sha256').update(`${previousHash}${actorId}${action}${targetId}${timestamp.toISOString()}`).digest('hex');
}

/**
 * Append-Only: mọi đường sửa/xóa qua mongoose (document và query) đều bị chặn ở tầng schema, nên không có route hay logic nào
 * cập nhật được audit_logs. (Chặn ở CSDL cần thêm quyền người dùng Mongo chỉ có insert/find cho collection này.)
 */
const IMMUTABLE_MESSAGE = 'audit_logs là Append-Only: không được sửa hoặc xóa bản ghi.';
for (const op of ['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete'] as const) {
  AuditLogSchema.pre(op as any, function () {
    throw new Error(IMMUTABLE_MESSAGE);
  });
}
AuditLogSchema.pre('save', function () {
  if (!this.isNew) throw new Error(IMMUTABLE_MESSAGE);
});
