import { useMutation, useQueryClient } from '@tanstack/react-query';
import adminClassesApi from '../../axios/adminClassesApi';
import adminPortalApi from '../../axios/adminPortalApi';
import type { PortalClassDetail, PortalClassRow } from '../../types/adminPortal';
import { liveTeacherIds, removeTeacher, toggleTeacher } from '../../pages/adminPortalModel';
import { QK, useActiveTeachers } from '../../pages/adminPortalQueries';
import { useToast } from '../Toast';
import { errorMessage } from './AdminUi';

type Rows = PortalClassRow[] | undefined;

/** Cập nhật dòng lớp trong cache ngay (không chờ máy chủ) để thẻ tag và sĩ số đổi tức thì. */
const patchRow = (rows: Rows, id: string, fn: (r: PortalClassRow) => PortalClassRow): Rows => rows?.map((r) => (r.id === id ? fn(r) : r));

/** Phân công giảng viên: lưu ngay khi tick/bỏ tick hoặc bấm ✕ trên thẻ; hoàn tác (và báo lỗi) nếu máy chủ từ chối. */
export function useAssignTeachers(cls: PortalClassRow) {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const teachers = useActiveTeachers();
  const nameOf = (id: string) => {
    const t = teachers.data?.items.find((x) => x.id === id);
    return t?.fullName || t?.email || cls.teachers.find((x) => x.id === id)?.name || id;
  };
  const lockedOf = (id: string) => cls.teachers.find((x) => x.id === id)?.locked;
  const patchTeachers = (ids: string[]) =>
    qc.setQueryData<Rows>(QK.classes, (rows) =>
      patchRow(rows, cls.id, (r) => ({ ...r, teachers: ids.map((id) => ({ id, name: nameOf(id), locked: lockedOf(id) })), missingTeacherIds: (r.missingTeacherIds ?? []).filter((x) => ids.includes(x)) })),
    );
  const onError = (err: unknown, ctx: { prev: Rows } | undefined) => {
    if (ctx?.prev) qc.setQueryData(QK.classes, ctx.prev);
    showToast(errorMessage(err, 'Không phân công được giảng viên.'), 'error');
  };
  const onSettled = () => {
    void qc.invalidateQueries({ queryKey: QK.classes });
    void qc.invalidateQueries({ queryKey: QK.audit });
  };
  const m = useMutation({
    mutationFn: (ids: string[]) => adminPortalApi.assignTeachers(cls.id, ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: QK.classes });
      const prev = qc.getQueryData<Rows>(QK.classes);
      patchTeachers(ids);
      return { prev };
    },
    onError: (err, _ids, ctx) => onError(err, ctx),
    onSettled,
  });
  // Gỡ một thẻ qua endpoint riêng: được gỡ cả thẻ duy nhất khi đó là id "ma" hoặc tài khoản đã khóa.
  const one = useMutation({
    mutationFn: (id: string) => adminPortalApi.removeTeacher(cls.id, id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.classes });
      const prev = qc.getQueryData<Rows>(QK.classes);
      patchTeachers(cls.teachers.map((t) => t.id).filter((x) => x !== id));
      return { prev };
    },
    onError: (err, _id, ctx) => onError(err, ctx),
    onSettled,
  });
  const current = cls.teachers.map((t) => t.id);
  // Danh sách gửi lên luôn bỏ id "ma" để request không bao giờ bị từ chối vì một tài khoản đã bị xóa từ trước.
  const live = liveTeacherIds(cls);
  const missing = new Set(cls.missingTeacherIds ?? []);
  return {
    teachers,
    current,
    pending: m.isPending || one.isPending,
    toggle: (id: string) => m.mutate(toggleTeacher(live, id)),
    remove: (id: string) => (missing.has(id) || lockedOf(id) || live.length <= 1 ? one.mutate(id) : m.mutate(removeTeacher(live, id))),
  };
}

/** Thêm/gỡ học viên khỏi lớp phổ thông, cập nhật tag và sĩ số ngay (±1), hoàn tác khi lỗi. */
export function useClassStudents(cls: PortalClassRow) {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const detailKey = QK.classDetail(cls.id);
  const bump = (delta: number) => qc.setQueryData<Rows>(QK.classes, (rows) => patchRow(rows, cls.id, (r) => ({ ...r, studentCount: Math.max(0, r.studentCount + delta) })));
  const settle = () => {
    void qc.invalidateQueries({ queryKey: detailKey });
    void qc.invalidateQueries({ queryKey: QK.classes });
    void qc.invalidateQueries({ queryKey: QK.users });
    void qc.invalidateQueries({ queryKey: QK.summary });
  };
  const rollback = (prev: { rows: Rows; detail: PortalClassDetail | undefined } | undefined, err: unknown, fallback: string) => {
    if (prev) {
      qc.setQueryData(QK.classes, prev.rows);
      qc.setQueryData(detailKey, prev.detail);
    }
    showToast(errorMessage(err, fallback), 'error');
  };
  const snapshot = async () => {
    await Promise.all([qc.cancelQueries({ queryKey: QK.classes }), qc.cancelQueries({ queryKey: detailKey })]);
    return { rows: qc.getQueryData<Rows>(QK.classes), detail: qc.getQueryData<PortalClassDetail>(detailKey) };
  };

  const add = useMutation({
    mutationFn: async (s: PortalClassDetail['students'][number]) => {
      const res = await adminClassesApi.addStudents(cls.id, [s.email]);
      if (res.added.length === 0) throw new Error(res.already.length ? 'Học viên đã có trong lớp.' : 'Không tìm thấy học viên.');
      return res;
    },
    onMutate: async (s) => {
      const prev = await snapshot();
      qc.setQueryData<PortalClassDetail | undefined>(detailKey, (d) => (d && !d.students.some((x) => x.id === s.id) ? { ...d, students: [...d.students, s] } : d));
      bump(1);
      return prev;
    },
    onError: (err, _s, prev) => rollback(prev, err, 'Không thêm được học viên.'),
    onSuccess: (_r, s) => showToast(`Đã thêm ${s.fullName || s.email} vào lớp.`, 'success'),
    onSettled: settle,
  });

  const remove = useMutation({
    mutationFn: (s: { id: string; fullName: string; email: string }) => adminClassesApi.removeStudent(cls.id, s.id),
    onMutate: async (s) => {
      const prev = await snapshot();
      qc.setQueryData<PortalClassDetail | undefined>(detailKey, (d) => (d ? { ...d, students: d.students.filter((x) => x.id !== s.id) } : d));
      bump(-1);
      return prev;
    },
    onError: (err, _s, prev) => rollback(prev, err, 'Không gỡ được học viên.'),
    onSuccess: (_r, s) => showToast(`Đã gỡ ${s.fullName || s.email} khỏi lớp.`, 'success'),
    onSettled: settle,
  });
  return { add, remove };
}

