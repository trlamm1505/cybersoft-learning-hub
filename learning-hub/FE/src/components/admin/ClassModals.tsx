import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import adminClassesApi from '../../axios/adminClassesApi';
import { AGE_GROUP_LABEL } from '../../pages/adminPortalModel';
import { QK, useActiveTeachers } from '../../pages/adminPortalQueries';
import { btnPrimary, btnSecondary, errorMessage, Field, inputCls, Modal, selectCls } from './AdminUi';

/** Tạo lớp mới: tên, mô tả (tùy chọn) và giảng viên phụ trách ban đầu (có thể thêm giảng viên khác ở bước phân công). */
export const CreateClassModal: React.FC<{ onClose: () => void; onDone: (msg: string) => void }> = ({ onClose, onDone }) => {
  const teachers = useActiveTeachers();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [error, setError] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () => adminClassesApi.create({ name: name.trim(), description: description.trim() || undefined, teacherId, ageGroup: ageGroup || undefined }),
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
        <Field label="Khối tuổi" hint="Chỉ học viên đúng khối mới thêm được vào lớp. Bỏ trống thì khối tự suy ra từ học viên đầu tiên.">
          <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className={selectCls}>
            <option value="">Chưa chọn</option>
            {(['3-5', '6-9', '10-12'] as const).map((g) => (
              <option key={g} value={g}>
                {AGE_GROUP_LABEL[g]}
              </option>
            ))}
          </select>
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
