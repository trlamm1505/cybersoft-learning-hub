import React, { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import adminUsersApi from '../axios/adminUsersApi';
import type { AdminOutletContext } from '../components/AdminLayout';
import { control, hairline, selectControl } from '../components/adminStyles';
import { StudentProfileDrawer } from '../components/StudentProfileDrawer';
import type { AdminUserList, AdminUserRow, UserRole } from '../types/teacherAnalytics';
import {
  ASSIGNABLE_ROLES,
  formatDateTime,
  pageInfo,
  ROLE_FILTERS,
  ROLE_VI,
  STATUS_VI,
  validateNewUser,
  type RevokeMode,
  type RoleFilter,
} from './adminModel';

const head = 'px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap';
const cell = 'px-3 py-2 text-sm text-[var(--text-main)] align-middle';
const link = 'cursor-pointer text-xs text-[var(--text-muted)] underline hover:text-[var(--text-main)] disabled:cursor-default disabled:no-underline disabled:opacity-50';
const linkMain = 'cursor-pointer text-sm text-indigo-600 underline disabled:cursor-default disabled:no-underline disabled:opacity-50 dark:text-indigo-400';

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const PAGE_SIZE = 20;

/** Hộp nhỏ tạo tài khoản: trường rõ ràng, một hành động chính, đóng bằng Esc hoặc bấm nền. */
const CreateUserModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'STUDENT' as UserRole });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateNewUser(form);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      await adminUsersApi.create({ ...form, fullName: form.fullName.trim(), email: form.email.trim() });
      onCreated();
    } catch (err) {
      setError(errorMessage(err, 'Không tạo được tài khoản.'));
      setBusy(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24" role="dialog" aria-modal="true" aria-label="Tạo tài khoản">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <form onSubmit={submit} className={`relative w-full max-w-sm space-y-3 rounded-md border bg-white p-5 shadow-lg dark:bg-neutral-950 ${hairline}`}>
        <h2 className="text-sm font-semibold text-[var(--text-main)]">Tạo tài khoản</h2>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Họ tên</span>
          <input autoFocus value={form.fullName} maxLength={100} onChange={set('fullName')} className={`${control} w-full`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Email</span>
          <input type="email" value={form.email} onChange={set('email')} className={`${control} w-full`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Mật khẩu ban đầu</span>
          <input type="password" autoComplete="new-password" value={form.password} onChange={set('password')} className={`${control} w-full`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Vai trò</span>
          <select value={form.role} onChange={set('role')} className={`${selectControl} w-full`}>
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_VI[r]}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p role="alert" className="text-xs text-rose-500">
            {error}
          </p>
        )}
        <div className="flex items-center gap-4 pt-1">
          <button type="submit" disabled={busy} className={linkMain}>
            {busy ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
          <button type="button" onClick={onClose} className={link}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

interface RevokeConflict {
  message: string;
  classes: Array<{ id: string; name: string }>;
}

/** Thu hồi quyền giảng viên: chọn hạ về học viên hoặc khóa hẳn; còn phụ trách lớp thì báo phải chuyển giao trước. */
const RevokeTeacherModal: React.FC<{ user: AdminUserRow; onClose: () => void; onDone: (msg: string) => void }> = ({
  user,
  onClose,
  onDone,
}) => {
  const [mode, setMode] = useState<RevokeMode>('STUDENT');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<RevokeConflict | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setConflict(null);
    try {
      await adminUsersApi.revokeTeacher(user.id, mode);
      onDone(mode === 'LOCK' ? 'Đã khóa tài khoản và hủy phiên đăng nhập.' : 'Đã thu hồi quyền giảng viên và hủy phiên đăng nhập.');
    } catch (err) {
      const data = (err as { response?: { status?: number; data?: Partial<RevokeConflict> } })?.response;
      if (data?.status === 409 && data.data?.classes?.length) {
        setConflict({ message: data.data.message ?? '', classes: data.data.classes });
      } else {
        setError(errorMessage(err, 'Không thu hồi được quyền.'));
      }
      setBusy(false);
    }
  };

  const options: Array<{ key: RevokeMode; title: string; note: string }> = [
    { key: 'STUDENT', title: 'Hạ về học viên', note: 'Giữ tài khoản, mất quyền giảng viên, phải đăng nhập lại.' },
    { key: 'LOCK', title: 'Khóa tài khoản', note: 'Không đăng nhập hay truy cập được cho tới khi mở khóa.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24" role="dialog" aria-modal="true" aria-label="Thu hồi quyền giảng viên">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`relative w-full max-w-sm space-y-3 rounded-md border bg-white p-5 shadow-lg dark:bg-neutral-950 ${hairline}`}>
        <h2 className="text-sm font-semibold text-[var(--text-main)]">Thu hồi quyền giảng viên</h2>
        <p className="text-xs text-[var(--text-muted)]">
          {user.fullName || user.email} ({user.email}). Mọi phiên đăng nhập hiện có của tài khoản này bị hủy ngay.
        </p>
        <fieldset className="space-y-1.5">
          <legend className="sr-only">Cách thu hồi</legend>
          {options.map((o) => (
            <label key={o.key} className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 ${hairline} ${mode === o.key ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}>
              <input type="radio" name="revoke-mode" checked={mode === o.key} onChange={() => setMode(o.key)} className="mt-0.5" />
              <span>
                <span className="block text-sm text-[var(--text-main)]">{o.title}</span>
                <span className="block text-xs text-[var(--text-muted)]">{o.note}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {conflict && (
          <div role="alert" className="space-y-1 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <p>{conflict.message}</p>
            <ul className="list-disc pl-4">
              {conflict.classes.map((c) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
            <Link to="/admin/classes" className="underline">
              Đi tới Quản lý lớp học để chuyển giao
            </Link>
          </div>
        )}
        {error && (
          <p role="alert" className="text-xs text-rose-500">
            {error}
          </p>
        )}
        <div className="flex items-center gap-4 pt-1">
          <button onClick={() => void submit()} disabled={busy} className="cursor-pointer text-sm text-rose-600 underline disabled:no-underline disabled:opacity-50 dark:text-rose-400">
            {busy ? 'Đang xử lý...' : 'Thu hồi quyền'}
          </button>
          <button onClick={onClose} className={link}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

/** Quản lý người dùng (Admin): bảng hairline, lọc theo vai trò, tìm kiếm, tạo tài khoản, đổi vai trò, khóa/mở khóa, mở hồ sơ. */
export const AdminUsersPage: React.FC = () => {
  const { authUser } = useOutletContext<AdminOutletContext>();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminUserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<AdminUserRow | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminUsersApi
      .list({ role: roleFilter === 'ALL' ? undefined : roleFilter, q: debounced || undefined, page, pageSize: PAGE_SIZE })
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Không tải được danh sách.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [roleFilter, debounced, page, reloadKey]);

  const act = useCallback(async (id: string, action: () => Promise<unknown>, done: string) => {
    setBusyId(id);
    setNotice(null);
    setError(null);
    try {
      await action();
      setNotice(done);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(errorMessage(err, 'Thao tác thất bại.'));
    } finally {
      setBusyId(null);
    }
  }, []);

  const info = data ? pageInfo(data.page, data.pageSize, data.total) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-[var(--text-main)]">Quản lý người dùng</h1>
        <button onClick={() => setCreating(true)} className={linkMain}>
          Tạo tài khoản
        </button>
      </div>

      <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 border-b pb-2 ${hairline}`}>
        <div className="flex gap-4" role="tablist" aria-label="Lọc theo vai trò">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={roleFilter === f.key}
              onClick={() => {
                setRoleFilter(f.key);
                setPage(1);
              }}
              className={`cursor-pointer border-b-2 px-0.5 pb-1 text-sm ${
                roleFilter === f.key ? 'border-indigo-600 font-medium text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          aria-label="Tìm theo tên, email hoặc mã số"
          placeholder="Tìm theo tên, email hoặc mã số"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${control} w-full max-w-xs`}
        />
        {(notice || error) && (
          <span role="status" className={`text-xs ${error ? 'text-rose-500' : 'text-[var(--text-muted)]'}`}>
            {error ?? notice}
          </span>
        )}
      </div>

      {loading && !data ? (
        <div className="flex items-center py-8 text-sm text-[var(--text-muted)]">
          <Loader2 className="mr-2 animate-spin" size={16} /> Đang tải...
        </div>
      ) : data && data.items.length === 0 ? (
        <p className="py-8 text-sm text-[var(--text-muted)]">{debounced || roleFilter !== 'ALL' ? 'Không có người dùng phù hợp.' : 'Chưa có người dùng nào.'}</p>
      ) : data ? (
        <div className={loading ? 'opacity-60' : ''}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {['Họ tên', 'Mã số', 'Email', 'Vai trò', 'Trạng thái', 'Ngày tạo', ''].map((h) => (
                    <th key={h} className={head}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((u: AdminUserRow) => {
                  const self = u.id === authUser.id;
                  const busy = busyId === u.id;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setOpenId(u.id)}
                      className={`cursor-pointer border-t hover:bg-neutral-50 dark:hover:bg-neutral-900 ${hairline} ${u.status === 'LOCKED' ? 'opacity-70' : ''}`}
                    >
                      <td className={`${cell} font-medium`}>{u.fullName || '—'}</td>
                      <td className={`${cell} tabular-nums text-[var(--text-muted)]`}>{u.studentCode ?? '—'}</td>
                      <td className={`${cell} text-[var(--text-muted)]`}>{u.email}</td>
                      <td className={cell} onClick={(e) => e.stopPropagation()}>
                        {u.role === 'ADMIN' ? (
                          // Quyền Admin không cấp và không đổi được từ giao diện (chống leo thang đặc quyền).
                          <span className="text-xs text-[var(--text-muted)]">{ROLE_VI.ADMIN}</span>
                        ) : u.role === 'TEACHER' ? (
                          <span className="flex items-center gap-3">
                            <span className="text-xs text-[var(--text-main)]">{ROLE_VI.TEACHER}</span>
                            <button className={link} disabled={busy} onClick={() => setRevoking(u)}>
                              Thu hồi quyền
                            </button>
                          </span>
                        ) : (
                          <select
                            aria-label={`Vai trò của ${u.fullName || u.email}`}
                            value={u.role}
                            disabled={busy}
                            onChange={(e) => void act(u.id, () => adminUsersApi.setRole(u.id, e.target.value as UserRole), 'Đã đổi vai trò.')}
                            className={`${selectControl} py-0.5 text-xs`}
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_VI[r]}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className={cell}>
                        <span className={u.status === 'LOCKED' ? 'text-rose-500' : 'text-[var(--text-muted)]'}>{STATUS_VI[u.status]}</span>
                        {u.role === 'STUDENT' && u.classCount !== undefined && u.classCount !== null && (
                          <span className="ml-2 text-xs text-[var(--text-muted)]">· {u.classCount === 0 ? 'Chưa vào lớp' : `${u.classCount} lớp`}</span>
                        )}
                      </td>
                      <td className={`${cell} whitespace-nowrap text-[var(--text-muted)]`}>{formatDateTime(u.createdAt)}</td>
                      <td className={`${cell} text-right`} onClick={(e) => e.stopPropagation()}>
                        <button
                          className={link}
                          disabled={self || busy}
                          title={self ? 'Không thể tự khóa tài khoản của mình' : undefined}
                          onClick={() =>
                            void act(
                              u.id,
                              () => adminUsersApi.setStatus(u.id, u.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED'),
                              u.status === 'LOCKED' ? 'Đã mở khóa.' : 'Đã khóa tài khoản.',
                            )
                          }
                        >
                          {u.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {info && (
            <div className={`flex items-center justify-between border-t pt-2 text-xs text-[var(--text-muted)] ${hairline}`}>
              <span>{info.label}</span>
              <span className="flex gap-4">
                <button className={link} disabled={!info.hasPrev} onClick={() => setPage((p) => p - 1)}>
                  Trước
                </button>
                <button className={link} disabled={!info.hasNext} onClick={() => setPage((p) => p + 1)}>
                  Sau
                </button>
              </span>
            </div>
          )}
        </div>
      ) : (
        error && <p className="text-sm text-rose-500">{error}</p>
      )}

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            setNotice('Đã tạo tài khoản.');
            setReloadKey((k) => k + 1);
          }}
        />
      )}
      {revoking && (
        <RevokeTeacherModal
          user={revoking}
          onClose={() => setRevoking(null)}
          onDone={(msg) => {
            setRevoking(null);
            setNotice(msg);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
      <StudentProfileDrawer userId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
};

export default AdminUsersPage;
