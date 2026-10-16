import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  AUDIT_ACTIONS,
  AuditLog,
  AuditLogDocument,
  type AuditAction,
  type AuditTargetType,
} from '../../modules-system/database/schemas/admin-portal.schemas';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

export const MAX_AUDIT_PAGE_SIZE = 100;

/** Ảnh chụp trạng thái người dùng dùng làm `before`/`after`: không bao giờ chứa mật khẩu. */
export interface UserSnapshot {
  fullName?: string;
  email?: string;
  role?: string;
  ageGroup?: string | null;
  status?: string;
}

/**
 * Nhật ký hoạt động của Admin (audit_logs). Chỉ ghi thêm. Lỗi ghi log được báo lỗi hệ thống (không nuốt im lặng)
 * nhưng không làm hỏng thao tác Admin vừa thực hiện xong.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectModel(AuditLog.name) private readonly logs: Model<AuditLogDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
  ) {}

  async record(
    actor: Pick<JwtPayload, 'sub' | 'email'>,
    action: AuditAction,
    targetType: AuditTargetType,
    targetId: string,
    before: unknown,
    after: unknown,
  ): Promise<void> {
    try {
      await this.logs.create({
        actorId: actor.sub,
        actorEmail: actor.email ?? '',
        action,
        targetType,
        targetId: String(targetId),
        diff: { before: before ?? null, after: after ?? null },
        timestamp: new Date(),
      });
    } catch (err) {
      this.logger.error(`Không ghi được audit log ${action} (${targetType}:${targetId}): ${(err as Error).message}`);
    }
  }

  /** Trạng thái hiện tại của một người dùng (để ghi `before`); null nếu không có. */
  async userSnapshot(id: string): Promise<UserSnapshot | null> {
    if (!isValidObjectId(id)) return null;
    const u = await this.users.findById(id).select('fullName email role ageGroup status').lean<UserSnapshot>();
    if (!u) return null;
    return { fullName: u.fullName, email: u.email, role: u.role, ageGroup: u.ageGroup ?? null, status: u.status ?? 'ACTIVE' };
  }

  /**
   * Bản ghi CLASS_ASSIGN cũ chỉ lưu id giảng viên: bổ sung teacherNames (tên người) khi đọc để giao diện không phải in mã id.
   * Giảng viên đã bị xóa thì để trống tên (giao diện hiện "Giảng viên đã xóa").
   */
  private async attachTeacherNames(rows: Array<{ diff?: { before?: any; after?: any } }>): Promise<void> {
    const need = new Set<string>();
    for (const r of rows) {
      for (const side of [r.diff?.before, r.diff?.after]) {
        if (side && Array.isArray(side.teacherIds) && !Array.isArray(side.teacherNames)) for (const id of side.teacherIds) if (isValidObjectId(id)) need.add(String(id));
      }
    }
    if (need.size === 0) return;
    const found = await this.users.find({ _id: { $in: [...need] } }).select('fullName email').lean<Array<{ _id: unknown; fullName?: string; email?: string }>>();
    const nameById = new Map(found.map((u) => [String(u._id), u.fullName || u.email || '']));
    for (const r of rows) {
      for (const side of [r.diff?.before, r.diff?.after]) {
        if (side && Array.isArray(side.teacherIds) && !Array.isArray(side.teacherNames)) side.teacherNames = side.teacherIds.map((id: string) => nameById.get(String(id)) ?? '');
      }
    }
  }

  async list(q: { page?: string; pageSize?: string; action?: string; actor?: string }) {
    const filter: Record<string, unknown> = {};
    if (q.action) {
      if (!(AUDIT_ACTIONS as readonly string[]).includes(q.action)) return { items: [], total: 0, page: 1, pageSize: 0 };
      filter.action = q.action;
    }
    const term = (q.actor ?? '').trim().slice(0, 80);
    if (term) filter.actorEmail = { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const pageSize = Math.min(MAX_AUDIT_PAGE_SIZE, Math.max(1, Math.floor(Number(q.pageSize)) || 20));
    const page = Math.max(1, Math.floor(Number(q.page)) || 1);
    const [rows, total] = await Promise.all([
      this.logs.find(filter).sort({ timestamp: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      this.logs.countDocuments(filter),
    ]);
    await this.attachTeacherNames(rows as any[]);
    return {
      items: rows.map((r: any) => ({
        id: String(r._id),
        timestamp: r.timestamp,
        actorId: r.actorId,
        actorEmail: r.actorEmail,
        action: r.action,
        targetType: r.targetType,
        targetId: r.targetId,
        diff: r.diff,
      })),
      total,
      page,
      pageSize,
    };
  }
}
