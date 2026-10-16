import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import adminClassesApi from '../../axios/adminClassesApi';
import adminPortalApi from '../../axios/adminPortalApi';
import type { PortalClassRow } from '../../types/adminPortal';
import { toggleTeacher } from '../../pages/adminPortalModel';
import { QK } from '../../pages/adminPortalQueries';
import { btnPrimary, btnSecondary, errorMessage, Field, inputCls, Modal, selectCls, Skeleton } from './AdminUi';

/** Giảng viên đang hoạt động (tối đa 100) cho các hộp chọn. */
function useActiveTeachers() {
  return useQuery({
    queryKey: [...QK.users, 'teachers-active'],
    queryFn: () => adminPortalApi.users({ role: 'TEACHER', status: 'ACTIVE', pageSize: 100 }),
    staleTime: 10_000,
  });
}

/** Phân công một hoặc nhiều giảng viên cho lớp. Người chọn đầu tiên là giảng viên chính. Có hiệu lực ngay. */
export const AssignTeachersModal: React.FC<{ cls: PortalClassRow; onClose: () => void; onDone: (msg: string) => void }> = ({ cls, onClose, onDone }) => {
  const teachers = useActiveTeachers();
  const [ids, setIds] = useState<string[]>(cls.teachers.map((t) => t.id));
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: () => adminPortalApi.assignTeachers(cls.id, ids),
    onSuccess: () => onDone(`Đã phân công ${ids.length} giảng viên cho lớp ${cls.name}. Có hiệu lực ngay.`),
    onError: (err) => setError(errorMessage(err, 'Không phân công được.')),
  });
  const list = teachers.data?.items ?? [];
  // Giảng viên đã gán nhưng không còn hoạt động (bị khóa) vẫn hiện để Admin gỡ ra.
  const orphans = cls.teachers.filter((t) => !list.some((x) => x.id === t.id));

  return (
    <Modal
      title={`Phân công giảng viên · ${cls.name}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className={btnSecondary}>
            Hủy
          </button>
          <button onClick={() => save.mutate()} disabled={save.isPending || ids.length === 0} className={btnPrimary}>
            {save.isPending && <Loader2 size={14} className="animate-spin" />} Lưu phân công ({ids.length})
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-[var(--text-muted)]">Chọn một hoặc nhiều giảng viên phụ trách. Người được chọn đầu tiên là giảng viên chính.</p>
        {teachers.isPending ? (
          <div className="space-y-2" role="status" aria-label="Đang tải giảng viên">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : (
          <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1" aria-label="Danh sách giảng viên">
            {[...list.map((t) => ({ id: t.id, name: t.fullName || t.email, email: t.email, gone: false })), ...orphans.map((t) => ({ id: t.id, name: t.name, email: 'Không còn hoạt động', gone: true }))].map((t) => {
              const on = ids.includes(t.id);
              return (
                <li key={t.id}>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 ${on ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-neutral-200 dark:border-neutral-800'}`}>
                    <input type="checkbox" checked={on} onChange={() => setIds(toggleTeacher(ids, t.id))} className="h-4 w-4 cursor-pointer accent-indigo-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[var(--text-main)]">{t.name}</span>
                      <span className={`block truncate text-xs ${t.gone ? 'text-rose-600 dark:text-rose-300' : 'text-[var(--text-muted)]'}`}>{t.email}</span>
                    </span>
                    {on && ids[0] === t.id && <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Chính</span>}
                    {on && <Check size={16} className="text-indigo-600" />}
                  </label>
                </li>
              );
            })}
            {list.length === 0 && orphans.length === 0 && <li className="py-6 text-center text-sm text-[var(--text-muted)]">Chưa có giảng viên nào đang hoạt động.</li>}
          </ul>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
};

/** Tạo lớp mới: tên, mô tả (tùy chọn) và giảng viên phụ trách ban đầu (có thể thêm giảng viên khác ở bước phân công). */
export const CreateClassModal: React.FC<{ onClose: () => void; onDone: (msg: string) => void }> = ({ onClose, onDone }) => {
  const teachers = useActiveTeachers();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () => adminClassesApi.create({ name: name.trim(), description: description.trim() || undefined, teacherId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.classes });
      onDone('Đã tạo lớp mới.');
    },
    onError: (err) => setError(errorMessage(err, 'Không tạo được lớp.')),
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Nhập tên lớp.');
    if (!teacherId) return setError('Chọn giảng viên phụ trách.');
    setError(null);
    create.mutate();
  };

  return (
    <Modal
      title="Tạo lớp mới"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Hủy
          </button>
          <button type="submit" form="create-class-form" disabled={create.isPending} className={btnPrimary}>
            {create.isPending && <Loader2 size={14} className="animate-spin" />} Tạo lớp
          </button>
        </>
      }
    >
      <form id="create-class-form" onSubmit={submit} className="space-y-3.5">
        <Field label="Tên lớp">
          <input autoFocus value={name} maxLength={100} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Mô tả (tùy chọn)">
          <input value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Giảng viên phụ trách">
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={selectCls} disabled={teachers.isPending}>
            <option value="">{teachers.isPending ? 'Đang tải...' : 'Chọn giảng viên...'}</option>
            {(teachers.data?.items ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName || t.email}
              </option>
            ))}
          </select>
        </Field>
        {error && (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
};
