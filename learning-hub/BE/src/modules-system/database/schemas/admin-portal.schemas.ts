import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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
  'CONFIG_UPDATE',
  'BULK_LOCK',
  'BULK_UNLOCK',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditTargetType = 'USER' | 'CLASS' | 'CONFIG';

@Schema({ collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true, type: String, index: true })
  actorId: string;

  @Prop({ required: true, type: String, index: true })
  actorEmail: string;

  @Prop({ required: true, type: String, enum: AUDIT_ACTIONS, index: true })
  action: AuditAction;

  @Prop({ required: true, type: String, enum: ['USER', 'CLASS', 'CONFIG'] })
  targetType: AuditTargetType;

  @Prop({ required: true, type: String })
  targetId: string;

  /** Trước/sau khi đổi. Giá trị bí mật (API key) luôn được che trước khi ghi. */
  @Prop({ type: Object, default: {} })
  diff: { before: unknown; after: unknown };

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ timestamp: -1 });
