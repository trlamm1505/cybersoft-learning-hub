import { useMutation, useQueryClient } from '@tanstack/react-query';
import adminClassesApi from '../../axios/adminClassesApi';
import adminPortalApi from '../../axios/adminPortalApi';
import type { PortalClassDetail, PortalClassRow } from '../../types/adminPortal';
import { removeTeacher, toggleTeacher } from '../../pages/adminPortalModel';
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
  const m = useMutation({
    mutationFn: (ids: string[]) => adminPortalApi.assignTeachers(cls.id, ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: QK.classes });
      const prev = qc.getQueryData<Rows>(QK.classes);
      qc.setQueryData<Rows>(QK.classes, (rows) => patchRow(rows, cls.id, (r) => ({ ...r, teachers: ids.map((id) => ({ id, name: nameOf(id) })) })));
      return { prev };
    },
    onError: (err, _ids, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.classes, ctx.prev);
      showToast(errorMessage(err, 'Không phân công được giảng viên.'), 'error');
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: QK.classes });
      void qc.invalidateQueries({ queryKey: QK.audit });
    },
  });
  const current = cls.teachers.map((t) => t.id);
  return {
    teachers,
    current,
    pending: m.isPending,
    toggle: (id: string) => m.mutate(toggleTeacher(current, id)),
    remove: (id: string) => m.mutate(removeTeacher(current, id)),
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

