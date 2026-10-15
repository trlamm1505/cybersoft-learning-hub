import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  ProctorAlert,
  ProctorAlertDocument,
} from '../../modules-system/database/schemas/proctor-alert.schema';
import {
  Contest,
  ContestDocument,
} from '../../modules-system/database/schemas/contest.schema';
import {
  ContestAttempt,
  ContestAttemptDocument,
} from '../../modules-system/database/schemas/contest-attempt.schema';
import {
  ClassAssignment,
  ClassAssignmentDocument,
} from '../../modules-system/database/schemas/class-assignment.schema';
import {
  Classroom,
  ClassroomDocument,
} from '../../modules-system/database/schemas/classroom.schema';
import {
  User,
  UserDocument,
} from '../../modules-system/database/schemas/user.schema';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import {
  assignmentAlertMessage,
  assignmentLeaveOutcome,
  contestAlertMessage,
  contestLeaveOutcome,
  CONTEST_LOCK_AT,
} from './proctor-rules';

export type ProctorScope = 'CONTEST' | 'CLASS_ASSIGNMENT';

export interface LeaveResult {
  /** Tổng số lần rời màn hình do máy chủ đếm. */
  count: number;
  /** Cuộc thi: đã khóa phòng thi và nộp bài ép buộc. */
  locked: boolean;
  /** Lượt thi đã đóng từ trước (đã nộp/khóa): không đếm thêm. */
  closed: boolean;
  /** Giảng viên đã được báo ở lần này. */
  teacherNotified: boolean;
  lockAt?: number;
}

/**
 * Đếm số lần học viên rời màn hình khi làm bài và cảnh báo giảng viên. Bộ đếm do
 * SERVER giữ (không tin client), danh tính luôn lấy từ token. Chỉ ghi nhận và cảnh báo:
 * không bao giờ đổi điểm; riêng cuộc thi, lần thứ 3 sẽ khóa phòng thi và nộp bài.
 */
@Injectable()
export class ProctorService {
  constructor(
    @InjectModel(ProctorAlert.name)
    private readonly alerts: Model<ProctorAlertDocument>,
    @InjectModel(Contest.name)
    private readonly contests: Model<ContestDocument>,
    @InjectModel(ContestAttempt.name)
    private readonly attempts: Model<ContestAttemptDocument>,
    @InjectModel(ClassAssignment.name)
    private readonly assignments: Model<ClassAssignmentDocument>,
    @InjectModel(Classroom.name)
    private readonly classes: Model<ClassroomDocument>,
    @InjectModel(User.name)
    private readonly users: Model<UserDocument>,
  ) {}

  async recordLeave(
    scope: string,
    refId: string,
    user: JwtPayload,
    now: Date = new Date(),
  ): Promise<LeaveResult> {
    if (scope === 'CONTEST') return this.contestLeave(refId, user, now);
    if (scope === 'CLASS_ASSIGNMENT') return this.assignmentLeave(refId, user, now);
    throw new BadRequestException('Loại bài không hợp lệ.');
  }

  private async studentName(userId: string): Promise<string> {
    const u: any = await this.users.findById(userId).select('fullName').lean();
    return u?.fullName || 'Học viên';
  }

  private async contestLeave(refId: string, user: JwtPayload, now: Date): Promise<LeaveResult> {
    const contest: any = isValidObjectId(refId)
      ? await this.contests.findById(refId).lean()
      : await this.contests.findOne({ slug: refId }).lean();
    if (!contest) throw new NotFoundException('Không tìm thấy cuộc thi.');
    const contestId = String(contest._id);

    const attempt: any = await this.attempts
      .findOne({ contestId, studentId: user.sub })
      .lean();
    if (!attempt) throw new NotFoundException('Bạn chưa vào phòng thi này.');
    // Giám sát bắt buộc với mọi cuộc thi (không phụ thuộc cờ integrityEnabled).
    if (attempt.finishedAt) {
      return {
        count: attempt.leaveCount ?? 0,
        locked: attempt.finishReason === 'CHEAT_LOCK',
        closed: true,
        teacherNotified: false,
      };
    }

    const updated: any = await this.attempts
      .findOneAndUpdate(
        { _id: attempt._id, finishedAt: { $exists: false } },
        { $inc: { leaveCount: 1 } },
        { new: true },
      )
      .lean();
    if (!updated) {
      // Vừa nộp xong trong lúc gửi sự kiện: không đếm thêm.
      return { count: attempt.leaveCount ?? 0, locked: false, closed: true, teacherNotified: false };
    }
    const count: number = updated.leaveCount ?? 1;
    const outcome = contestLeaveOutcome(count);

    if (outcome.lock) {
      await this.attempts.updateOne(
        { _id: attempt._id, finishedAt: { $exists: false } },
        { $set: { finishedAt: now, finishReason: 'CHEAT_LOCK' } },
      );
    }
    if (outcome.notifyTeacher) {
      const name = attempt.studentName || (await this.studentName(user.sub));
      await this.upsertAlert(
        { kind: 'CONTEST', userId: user.sub, refId: contestId },
        {
          studentName: name,
          refTitle: contest.title ?? '',
          leaveCount: count,
          severity: outcome.severity,
          message: contestAlertMessage(name, count, outcome.lock),
          lastLeaveAt: now,
          status: 'OPEN',
        },
      );
    }
    return {
      count,
      locked: outcome.lock,
      closed: outcome.lock,
      teacherNotified: outcome.notifyTeacher,
      lockAt: CONTEST_LOCK_AT,
    };
  }

  private async assignmentLeave(refId: string, user: JwtPayload, now: Date): Promise<LeaveResult> {
    if (!isValidObjectId(refId)) throw new NotFoundException('Không tìm thấy bài tập của lớp.');
    const a: any = await this.assignments.findById(refId).lean();
    if (!a) throw new NotFoundException('Không tìm thấy bài tập của lớp.');
    // Chỉ học viên thuộc lớp mới ghi được (lớp khác: 404, không lộ sự tồn tại).
    const cls: any = await this.classes
      .findOne({ _id: a.classId, studentIds: user.sub, archived: { $ne: true } })
      .lean();
    if (!cls) throw new NotFoundException('Không tìm thấy lớp học của bạn.');

    const name = await this.studentName(user.sub);
    const key = { kind: 'CLASS_ASSIGNMENT' as const, userId: user.sub, refId: String(a._id) };
    const doc: any = await this.alerts
      .findOneAndUpdate(
        key,
        {
          $inc: { leaveCount: 1 },
          $set: {
            studentName: name,
            refTitle: a.title ?? '',
            classId: String(cls._id),
            className: cls.name,
            teacherId: cls.teacherId,
            lastLeaveAt: now,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean();
    const count: number = doc.leaveCount ?? 1;
    const outcome = assignmentLeaveOutcome(count);
    if (outcome.notifyTeacher) {
      await this.alerts.updateOne(
        { _id: doc._id },
        { $set: { severity: outcome.severity, message: assignmentAlertMessage(name), status: 'OPEN' } },
      );
    }
    return { count, locked: false, closed: false, teacherNotified: outcome.notifyTeacher };
  }

  private async upsertAlert(
    key: { kind: ProctorScope; userId: string; refId: string },
    set: Record<string, unknown>,
  ) {
    await this.alerts.updateOne(key, { $set: set }, { upsert: true });
  }

  // ----------------------------- Giảng viên -----------------------------

  /** Cảnh báo giảng viên cần xem: bài lớp do mình phụ trách + mọi cuộc thi (admin: tất cả). */
  async listForTeacher(user: JwtPayload, status?: string, limit = 100) {
    const wantAck = status === 'ACKNOWLEDGED';
    const filter: Record<string, unknown> = {
      status: wantAck ? 'ACKNOWLEDGED' : 'OPEN',
      severity: { $in: ['WARNING', 'LOCKED'] },
    };
    if (user.role !== 'ADMIN') {
      filter.$or = [{ kind: 'CONTEST' }, { teacherId: user.sub }];
    }
    const docs = await this.alerts.find(filter).sort({ updatedAt: -1 }).limit(limit).lean();
    return docs.map((d: any) => ({
      id: String(d._id),
      kind: d.kind,
      severity: d.severity,
      status: d.status,
      message: d.message,
      leaveCount: d.leaveCount,
      student: { id: d.userId, fullName: d.studentName },
      refId: d.refId,
      refTitle: d.refTitle,
      classId: d.classId ?? null,
      className: d.className ?? null,
      lastLeaveAt: d.lastLeaveAt ?? null,
    }));
  }

  async acknowledge(id: string, user: JwtPayload) {
    if (!isValidObjectId(id)) throw new NotFoundException('Không tìm thấy cảnh báo.');
    const filter: Record<string, unknown> = { _id: id };
    if (user.role !== 'ADMIN') filter.$or = [{ kind: 'CONTEST' }, { teacherId: user.sub }];
    const res = await this.alerts.updateOne(filter, {
      $set: { status: 'ACKNOWLEDGED', acknowledgedBy: user.sub, acknowledgedAt: new Date() },
    });
    if (res.matchedCount === 0) throw new NotFoundException('Không tìm thấy cảnh báo.');
    return { id, status: 'ACKNOWLEDGED' };
  }
}
