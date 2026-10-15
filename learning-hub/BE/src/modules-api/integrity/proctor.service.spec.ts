import 'reflect-metadata';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../common/auth/roles.decorator';
import { ProctorService } from './proctor.service';
import { ProctorController } from './proctor.controller';
import { IntegrityController } from './integrity.controller';
import {
  assignmentAlertMessage,
  assignmentLeaveOutcome,
  contestAlertMessage,
  contestLeaveOutcome,
} from './proctor-rules';

const OID_CONTEST = '64b0000000000000000000c1';
const OID_ASSIGN = '64b0000000000000000000a1';
const OID_CLASS = '64b0000000000000000000b1';
const student = { sub: 'stu1', role: 'STUDENT' } as any;

const lean = (value: unknown) => ({ lean: jest.fn().mockResolvedValue(value) });
const selectLean = (value: unknown) => ({ select: jest.fn(() => lean(value)) });

describe('proctor-rules', () => {
  it('cuộc thi: lần 1 báo giảng viên, lần 3 khóa phòng thi', () => {
    expect(contestLeaveOutcome(1)).toEqual({ notifyTeacher: true, lock: false, severity: 'WARNING' });
    expect(contestLeaveOutcome(2).lock).toBe(false);
    expect(contestLeaveOutcome(3)).toEqual({ notifyTeacher: true, lock: true, severity: 'LOCKED' });
    expect(contestLeaveOutcome(7).lock).toBe(true);
  });

  it('bài lớp: chỉ báo giảng viên khi rời quá 2 lần', () => {
    expect(assignmentLeaveOutcome(1).notifyTeacher).toBe(false);
    expect(assignmentLeaveOutcome(2).notifyTeacher).toBe(false);
    expect(assignmentLeaveOutcome(3).notifyTeacher).toBe(true);
  });

  it('thông điệp cảnh báo', () => {
    expect(assignmentAlertMessage('An')).toBe('Học viên An đã rời màn hình làm bài > 2 lần');
    expect(contestAlertMessage('An', 1, false)).toContain('lần 1');
    expect(contestAlertMessage('An', 3, true)).toContain('khóa phòng thi');
  });
});

describe('ProctorService', () => {
  let alerts: any;
  let contests: any;
  let attempts: any;
  let assignments: any;
  let classes: any;
  let users: any;
  let service: ProctorService;

  beforeEach(() => {
    alerts = { findOneAndUpdate: jest.fn(), updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }), find: jest.fn() };
    contests = { findById: jest.fn(), findOne: jest.fn() };
    attempts = { findOne: jest.fn(), findOneAndUpdate: jest.fn(), updateOne: jest.fn().mockResolvedValue({}) };
    assignments = { findById: jest.fn() };
    classes = { findOne: jest.fn() };
    users = { findById: jest.fn(() => selectLean({ fullName: 'Nguyễn An' })) };
    service = new ProctorService(alerts, contests, attempts, assignments, classes, users);
  });

  it('loại bài lạ -> 400', async () => {
    await expect(service.recordLeave('HACK', 'x', student)).rejects.toThrow(BadRequestException);
  });

  describe('cuộc thi', () => {
    const arrange = (leaveCount: number, attemptOverrides: object = {}) => {
      contests.findById.mockReturnValue(lean({ _id: OID_CONTEST, title: 'Thi cuối kỳ', integrityEnabled: true }));
      attempts.findOne.mockReturnValue(lean({ _id: 'att1', studentName: 'Nguyễn An', leaveCount: leaveCount - 1, ...attemptOverrides }));
      attempts.findOneAndUpdate.mockReturnValue(lean({ _id: 'att1', leaveCount }));
    };

    it('lần 1: báo giảng viên ngay, chưa khóa', async () => {
      arrange(1);
      const r = await service.recordLeave('CONTEST', OID_CONTEST, student);
      expect(r).toMatchObject({ count: 1, locked: false, teacherNotified: true });
      expect(attempts.updateOne).not.toHaveBeenCalled();
      expect(alerts.updateOne).toHaveBeenCalledWith(
        { kind: 'CONTEST', userId: 'stu1', refId: OID_CONTEST },
        expect.objectContaining({ $set: expect.objectContaining({ severity: 'WARNING', leaveCount: 1, status: 'OPEN' }) }),
        { upsert: true },
      );
    });

    it('lần 3: khóa phòng thi, nộp bài ép buộc với lý do CHEAT_LOCK', async () => {
      arrange(3);
      const r = await service.recordLeave('CONTEST', OID_CONTEST, student);
      expect(r).toMatchObject({ count: 3, locked: true, closed: true });
      expect(attempts.updateOne).toHaveBeenCalledWith(
        { _id: 'att1', finishedAt: { $exists: false } },
        { $set: { finishedAt: expect.any(Date), finishReason: 'CHEAT_LOCK' } },
      );
      const alertSet = alerts.updateOne.mock.calls[0][1].$set;
      expect(alertSet.severity).toBe('LOCKED');
    });

    it('đã nộp/khóa từ trước thì không đếm thêm', async () => {
      arrange(4, { finishedAt: new Date(), finishReason: 'CHEAT_LOCK', leaveCount: 3 });
      const r = await service.recordLeave('CONTEST', OID_CONTEST, student);
      expect(r).toMatchObject({ count: 3, locked: true, closed: true, teacherNotified: false });
      expect(attempts.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('chưa vào phòng thi -> 404', async () => {
      contests.findById.mockReturnValue(lean({ _id: OID_CONTEST }));
      attempts.findOne.mockReturnValue(lean(null));
      await expect(service.recordLeave('CONTEST', OID_CONTEST, student)).rejects.toThrow(NotFoundException);
    });

    it('cuộc thi tắt giám sát thì bỏ qua', async () => {
      contests.findById.mockReturnValue(lean({ _id: OID_CONTEST, integrityEnabled: false }));
      attempts.findOne.mockReturnValue(lean({ _id: 'att1' }));
      const r = await service.recordLeave('CONTEST', OID_CONTEST, student);
      expect(r.teacherNotified).toBe(false);
      expect(attempts.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('bài tập lớp', () => {
    const arrange = (leaveCount: number) => {
      assignments.findById.mockReturnValue(lean({ _id: OID_ASSIGN, classId: OID_CLASS, title: 'Bài 1' }));
      classes.findOne.mockReturnValue(lean({ _id: OID_CLASS, name: 'Lớp 6-9', teacherId: 'tea1' }));
      alerts.findOneAndUpdate.mockReturnValue(lean({ _id: 'al1', leaveCount }));
    };

    it('rời 1-2 lần: chỉ đếm, chưa báo giảng viên', async () => {
      arrange(2);
      const r = await service.recordLeave('CLASS_ASSIGNMENT', OID_ASSIGN, student);
      expect(r).toMatchObject({ count: 2, teacherNotified: false, locked: false });
      expect(alerts.updateOne).not.toHaveBeenCalled();
    });

    it('rời lần thứ 3 (> 2): báo giảng viên đúng nội dung', async () => {
      arrange(3);
      const r = await service.recordLeave('CLASS_ASSIGNMENT', OID_ASSIGN, student);
      expect(r).toMatchObject({ count: 3, teacherNotified: true });
      expect(alerts.updateOne).toHaveBeenCalledWith(
        { _id: 'al1' },
        { $set: { severity: 'WARNING', message: 'Học viên Nguyễn An đã rời màn hình làm bài > 2 lần', status: 'OPEN' } },
      );
    });

    it('học viên không thuộc lớp -> 404, không ghi gì', async () => {
      assignments.findById.mockReturnValue(lean({ _id: OID_ASSIGN, classId: OID_CLASS }));
      classes.findOne.mockReturnValue(lean(null));
      await expect(service.recordLeave('CLASS_ASSIGNMENT', OID_ASSIGN, student)).rejects.toThrow(NotFoundException);
      expect(alerts.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('id không hợp lệ -> 404', async () => {
      await expect(service.recordLeave('CLASS_ASSIGNMENT', 'abc', student)).rejects.toThrow(NotFoundException);
    });
  });

  describe('phía giảng viên', () => {
    it('giảng viên chỉ thấy cuộc thi + bài lớp của mình; admin thấy tất cả', async () => {
      const chain: any = { sort: jest.fn(() => chain), limit: jest.fn(() => chain), lean: jest.fn().mockResolvedValue([]) };
      alerts.find.mockReturnValue(chain);
      await service.listForTeacher({ sub: 'tea1', role: 'TEACHER' } as any);
      expect(alerts.find.mock.calls[0][0].$or).toEqual([{ kind: 'CONTEST' }, { teacherId: 'tea1' }]);
      await service.listForTeacher({ sub: 'adm', role: 'ADMIN' } as any);
      expect(alerts.find.mock.calls[1][0].$or).toBeUndefined();
    });

    it('ack cảnh báo không thuộc mình -> 404', async () => {
      alerts.updateOne.mockResolvedValue({ matchedCount: 0 });
      await expect(service.acknowledge(OID_ASSIGN, { sub: 'tea2', role: 'TEACHER' } as any)).rejects.toThrow(NotFoundException);
    });
  });
});

describe('phân quyền endpoint giám sát', () => {
  it('POST /proctor/leave chỉ cho STUDENT', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ProctorController)).toEqual(['STUDENT']);
    expect(Reflect.getMetadata(GUARDS_METADATA, ProctorController).length).toBe(2);
  });

  it('danh sách cảnh báo giảng viên chỉ cho TEACHER/ADMIN', () => {
    expect(Reflect.getMetadata(ROLES_KEY, IntegrityController)).toEqual(['TEACHER', 'ADMIN']);
  });
});
