import type { ProctorAlertSeverity } from '../../modules-system/database/schemas/proctor-alert.schema';

/** Cuộc thi: lần rời đầu tiên đã báo giảng viên; lần thứ 3 khóa phòng thi và nộp bài. */
export const CONTEST_ALERT_AT = 1;
export const CONTEST_LOCK_AT = 3;
/** Bài tập lớp: chỉ báo giảng viên khi rời QUÁ 2 lần (từ lần thứ 3). */
export const ASSIGNMENT_ALERT_AFTER = 2;

export interface LeaveOutcome {
  /** Có tạo/cập nhật cảnh báo cho giảng viên hay không. */
  notifyTeacher: boolean;
  /** Chỉ cuộc thi: khóa phòng thi và nộp bài ép buộc. */
  lock: boolean;
  severity: ProctorAlertSeverity;
}

export function contestLeaveOutcome(count: number): LeaveOutcome {
  if (count >= CONTEST_LOCK_AT) return { notifyTeacher: true, lock: true, severity: 'LOCKED' };
  if (count >= CONTEST_ALERT_AT) return { notifyTeacher: true, lock: false, severity: 'WARNING' };
  return { notifyTeacher: false, lock: false, severity: 'INFO' };
}

export function assignmentLeaveOutcome(count: number): LeaveOutcome {
  if (count > ASSIGNMENT_ALERT_AFTER) return { notifyTeacher: true, lock: false, severity: 'WARNING' };
  return { notifyTeacher: false, lock: false, severity: 'INFO' };
}

export function contestAlertMessage(studentName: string, count: number, lock: boolean): string {
  if (lock) {
    return `Học viên ${studentName} đã rời màn hình thi ${count} lần: hệ thống đã khóa phòng thi và tự động nộp bài.`;
  }
  return `Học viên ${studentName} vừa rời màn hình thi (lần ${count}).`;
}

export function assignmentAlertMessage(studentName: string): string {
  return `Học viên ${studentName} đã rời màn hình làm bài > 2 lần`;
}
