import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TeacherAnalyticsService } from './teacher-analytics.service';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

const OID = (n: number) => `64b${String(n).padStart(21, '0')}`;
const T1: JwtPayload = { sub: OID(90), email: 't1@x', role: 'TEACHER' };
const T2: JwtPayload = { sub: OID(91), email: 't2@x', role: 'TEACHER' };
const CLASS_ID = OID(1);
const SUB_ID = OID(500);
const STUDENT = OID(12);

function build(submission: Record<string, unknown> | null) {
  const cls = { _id: CLASS_ID, name: 'Lớp 1', teacherId: T1.sub, teacherIds: [T1.sub], studentIds: [STUDENT], exerciseSlugs: [] };
  const classes: any = { findById: jest.fn().mockReturnValue({ lean: () => Promise.resolve(cls) }) };
  const sub = submission && { ...submission, save: jest.fn().mockResolvedValue(undefined) };
  const testerSubmissions: any = { findById: jest.fn().mockResolvedValue(sub) };
  const audit: any = { record: jest.fn().mockResolvedValue(undefined) };
  const service = new TeacherAnalyticsService(classes, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, undefined, testerSubmissions, audit);
  return { service, sub: sub as any, audit };
}

const baseSub = { userId: STUDENT, status: 'REVIEWED', isFinalized: false, invalidated: false, rubricGrades: [{ key: 'a', score: 3 }] };

describe('Hủy kết quả bài nộp (invalidate)', () => {
  it('thiếu reason hoặc quá ngắn -> 400 ngay, chưa đụng tới bài nộp', async () => {
    const { service, sub, audit } = build(baseSub);
    await expect(service.invalidateSubmission(T1, CLASS_ID, { submissionId: SUB_ID })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.invalidateSubmission(T1, CLASS_ID, { submissionId: SUB_ID, reason: 'ngắn quá' })).rejects.toBeInstanceOf(BadRequestException);
    expect(sub.save).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('giảng viên không phụ trách lớp -> 403 E403_CLASS_NOT_OWNED (IDOR)', async () => {
    const { service } = build(baseSub);
    await expect(service.invalidateSubmission(T2, CLASS_ID, { submissionId: SUB_ID, reason: 'lý do đủ dài rồi' })).rejects.toMatchObject({
      response: { code: 'E403_CLASS_NOT_OWNED' },
    });
  });

  it('hủy thành công: xóa điểm, về SUBMITTED và ghi audit kèm lý do', async () => {
    const { service, sub, audit } = build(baseSub);
    await service.invalidateSubmission(T1, CLASS_ID, { submissionId: SUB_ID, reason: 'Phát hiện gian lận khi nộp bài' });
    expect(sub).toMatchObject({ invalidated: true, status: 'SUBMITTED', rubricGrades: [] });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ sub: T1.sub }),
      'SUBMISSION_INVALIDATE',
      'SUBMISSION',
      SUB_ID,
      expect.anything(),
      expect.anything(),
      'Phát hiện gian lận khi nộp bài',
    );
  });

  it('bài đã chốt điểm không hủy được (phải qua phúc khảo)', async () => {
    const { service } = build({ ...baseSub, isFinalized: true });
    await expect(service.invalidateSubmission(T1, CLASS_ID, { submissionId: SUB_ID, reason: 'lý do đủ dài rồi' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('bài của học viên ngoài lớp -> 403', async () => {
    const { service } = build({ ...baseSub, userId: OID(77) });
    await expect(service.invalidateSubmission(T1, CLASS_ID, { submissionId: SUB_ID, reason: 'lý do đủ dài rồi' })).rejects.toMatchObject({
      response: { code: 'E403_CLASS_NOT_OWNED' },
    });
  });
});
