import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import adminUsersApi from '../../axios/adminUsersApi';
import type { RevokeMode } from '../../pages/adminModel';
import { btnDanger, btnSecondary, errorMessage, Modal } from './AdminUi';

interface Conflict {
  message: string;
  classes: Array<{ id: string; name: string }>;
}

/** Thu hồi quyền giảng viên: hạ về học viên hoặc khóa hẳn; còn phụ trách lớp thì phải chuyển giao trước (BE trả 409 kèm danh sách lớp). */
export const RevokeTeacherModal: React.FC<{
  user: { id: string; fullName: string; email: string };
  onClose: () => void;
  onDone: (msg: string) => void;
}> = ({ user, onClose, onDone }) => {
  const [mode, setMode] = useState<RevokeMode>('STUDENT');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<Conflict | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setConflict(null);
    try {
      await adminUsersApi.revokeTeacher(user.id, mode);
      onDone(mode === 'LOCK' ? 'Đã khóa tài khoản và hủy phiên đăng nhập.' : 'Đã thu hồi quyền giảng viên và hủy phiên đăng nhập.');
    } catch (err) {
      const res = (err as { response?: { status?: number; data?: Partial<Conflict> } })?.response;
      if (res?.status === 409 && res.data?.classes?.length) setConflict({ message: res.data.message ?? '', classes: res.data.classes });
      else setError(errorMessage(err, 'Không thu hồi được quyền.'));
      setBusy(false);
    }
  };

  const options: Array<{ key: RevokeMode; title: string; note: string }> = [
    { key: 'STUDENT', title: 'Hạ về học viên', note: 'Giữ tài khoản, mất quyền giảng viên, phải đăng nhập lại.' },
    { key: 'LOCK', title: 'Khóa tài khoản', note: 'Không đăng nhập hay truy cập được cho tới khi mở khóa.' },
  ];

  return (
    <Modal
      title="Thu hồi quyền giảng viên"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className={btnSecondary}>
            Hủy
          </button>
          <button onClick={() => void submit()} disabled={busy} className={btnDanger}>
            {busy && <Loader2 size={14} className="animate-spin" />} Thu hồi quyền
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-[var(--text-muted)]">
          {user.fullName || user.email} ({user.email}). Mọi phiên đăng nhập hiện có của tài khoản này bị hủy ngay.
        </p>
        <fieldset className="space-y-2">
          <legend className="sr-only">Cách thu hồi</legend>
          {options.map((o) => (
            <label
              key={o.key}
              className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 ${
                mode === o.key ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <input type="radio" name="revoke-mode" checked={mode === o.key} onChange={() => setMode(o.key)} className="mt-1" />
              <span>
                <span className="block text-sm font-medium text-[var(--text-main)]">{o.title}</span>
                <span className="block text-xs text-[var(--text-muted)]">{o.note}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {conflict && (
          <div role="alert" className="space-y-1 rounded-lg border border-amber-400/60 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <p>{conflict.message}</p>
            <ul className="list-disc pl-4">
              {conflict.classes.map((c) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
            <Link to="/admin/classes" className="font-medium underline">
              Đi tới Quản lý lớp học để chuyển giao
            </Link>
          </div>
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
