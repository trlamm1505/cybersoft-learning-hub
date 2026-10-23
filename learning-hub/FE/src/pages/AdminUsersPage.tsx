import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Pencil, Plus, Search, Unlock, X } from 'lucide-react';
import adminPortalApi from '../axios/adminPortalApi';
import type { AdminOutletContext } from '../components/AdminLayout';
import { StudentProfileDrawer } from '../components/StudentProfileDrawer';
import { btnDanger, btnGhost, btnPrimary, btnSecondary, card, ConfirmModal, ErrorBanner, errorMessage, PageHeader, Pill, selectCls, inputCls, SkeletonRows } from '../components/admin/AdminUi';
import { RevokeTeacherModal } from '../components/admin/RevokeTeacherModal';
import { CreateUserModal, EditUserModal } from '../components/admin/UserFormModal';
import { useToast } from '../components/Toast';
import type { AgeGroupKey, PortalUserRow } from '../types/adminPortal';
import type { UserRole, UserStatus } from '../types/teacherAnalytics';
import { pageInfo, ROLE_VI } from './adminModel';
import {
  AGE_GROUP_LABEL,
  AGE_GROUP_ORDER,
  ageGroupLabel,
  isLocked,
  isSelectable,
  QUERY_STALE_MS,
  ROLE_TONE,
  selectionLabel,
  STATUS_PILL,
  toggleId,
  togglePage,
} from './adminPortalModel';
import { QK } from './adminPortalQueries';

const PAGE_SIZE = 20;
const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap';
const td = 'px-4 py-3 text-sm text-[var(--text-main)] align-middle';

type ConfirmState = { kind: 'toggle'; user: PortalUserRow } | { kind: 'bulk'; isActive: boolean } | null;

/** Quản lý người dùng (/admin/users): tìm kiếm, bộ lọc, chọn nhiều để khóa/mở khóa hàng loạt, thêm/sửa, khóa nhanh có xác nhận. */
export const AdminUsersPage: React.FC = () => {
  const { authUser } = useOutletContext<AdminOutletContext>();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [role, setRole] = useState<'' | UserRole>('');
  const [ageGroup, setAgeGroup] = useState<'' | AgeGroupKey>('');
  const [status, setStatus] = useState<'' | UserStatus>('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PortalUserRow | null>(null);
  const [revoking, setRevoking] = useState<PortalUserRow | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: [...QK.users, { role, ageGroup, status, q: debounced, page }],
    queryFn: () =>
      adminPortalApi.users({
        role: role || undefined,
        ageGroup: ageGroup || undefined,
        status: status || undefined,
        q: debounced || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
    staleTime: QUERY_STALE_MS,
  });

  const refreshAll = () => {
    void qc.invalidateQueries({ queryKey: QK.users });
    void qc.invalidateQueries({ queryKey: QK.summary });
    void qc.invalidateQueries({ queryKey: QK.audit });
  };

  const toggle = useMutation({
    mutationFn: (u: PortalUserRow) => adminPortalApi.setStatus(u.id, isLocked(u) ? 'ACTIVE' : 'LOCKED'),
    onSuccess: (_r, u) => {
      showToast(isLocked(u) ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản. Người dùng bị đăng xuất ngay ở yêu cầu kế tiếp.', 'success');
      setConfirm(null);
      refreshAll();
    },
    onError: (err) => {
      showToast(errorMessage(err, 'Thao tác thất bại.'), 'error');
      setConfirm(null);
    },
  });

  const bulk = useMutation({
    mutationFn: (isActive: boolean) => adminPortalApi.bulkStatus([...selected], isActive),
    onSuccess: (res, isActive) => {
      const skipped = res.skipped.length ? ` (bỏ qua ${res.skipped.length})` : '';
      showToast(`${isActive ? 'Đã mở khóa' : 'Đã khóa'} ${res.updated} tài khoản${skipped}.`, res.updated > 0 ? 'success' : 'warning');
      setConfirm(null);
      setSelected(new Set());
      refreshAll();
    },
    onError: (err) => {
      showToast(errorMessage(err, 'Thao tác hàng loạt thất bại.'), 'error');
      setConfirm(null);
    },
  });

  const data = query.data;
  const items = useMemo(() => data?.items ?? [], [data]);
  const selectableIds = useMemo(() => items.filter((u) => isSelectable(u, authUser.id)).map((u) => u.id), [items, authUser.id]);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const info = data ? pageInfo(data.page, data.pageSize, data.total) : null;
  const filtered = !!(debounced || role || ageGroup || status);

  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
    setSelected(new Set());
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-24">
      <PageHeader
        title="Quản lý người dùng"
        subtitle="Khóa hoặc mở khóa có hiệu lực ngay ở yêu cầu kế tiếp của người dùng. Không có thao tác xóa vĩnh viễn."
        actions={
          <button onClick={() => setCreating(true)} className={btnPrimary}>
            <Plus size={16} /> Thêm người dùng mới
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            aria-label="Tìm theo tên hoặc email"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select aria-label="Lọc theo vai trò" value={role} onChange={(e) => resetPage(setRole)(e.target.value as '' | UserRole)} className={`${selectCls} lg:w-44`}>
          <option value="">Tất cả vai trò</option>
          {(['STUDENT', 'TEACHER', 'ADMIN'] as const).map((r) => (
            <option key={r} value={r}>
              {ROLE_VI[r]}
            </option>
          ))}
        </select>
        <select aria-label="Lọc theo khối học" value={ageGroup} onChange={(e) => resetPage(setAgeGroup)(e.target.value as '' | AgeGroupKey)} className={`${selectCls} lg:w-48`}>
          <option value="">Tất cả khối học</option>
          {AGE_GROUP_ORDER.map((g) => (
            <option key={g} value={g}>
              {AGE_GROUP_LABEL[g]}
            </option>
          ))}
        </select>
        <select aria-label="Lọc theo trạng thái" value={status} onChange={(e) => resetPage(setStatus)(e.target.value as '' | UserStatus)} className={`${selectCls} lg:w-44`}>
          <option value="">Mọi trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="LOCKED">Đã khóa</option>
        </select>
      </div>

      <ErrorBanner message={query.isError ? errorMessage(query.error, 'Không tải được danh sách người dùng.') : null} onRetry={() => void query.refetch()} />

      <div className={`${card} overflow-hidden`}>
        {query.isPending ? (
          <SkeletonRows rows={8} cols={6} />
        ) : items.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-[var(--text-muted)]">{filtered ? 'Không có người dùng nào phù hợp bộ lọc.' : 'Chưa có người dùng nào.'}</p>
        ) : (
          <div className={`overflow-x-auto ${query.isPlaceholderData ? 'opacity-60 transition-opacity' : ''}`}>
            <table className="min-w-full">
              <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950/50">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả trên trang"
                      checked={allSelected}
                      disabled={selectableIds.length === 0}
                      onChange={() => setSelected(togglePage(selected, selectableIds))}
                      className="h-4 w-4 cursor-pointer accent-indigo-600"
                    />
                  </th>
                  {['Họ tên', 'Email', 'Vai trò', 'Khối học', 'Trạng thái', ''].map((h) => (
                    <th key={h || 'actions'} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {items.map((u) => {
                  const self = u.id === authUser.id;
                  const canSelect = isSelectable(u, authUser.id);
                  const pill = STATUS_PILL[u.status] ?? STATUS_PILL.ACTIVE;
                  return (
                    <tr key={u.id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 ${selected.has(u.id) ? 'bg-indigo-50/60 dark:bg-indigo-500/10' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Chọn ${u.fullName || u.email}`}
                          checked={selected.has(u.id)}
                          disabled={!canSelect}
                          title={!canSelect ? (self ? 'Không thể chọn chính mình' : 'Không khóa hàng loạt tài khoản Admin') : undefined}
                          onChange={() => setSelected(toggleId(selected, u.id))}
                          className="h-4 w-4 cursor-pointer accent-indigo-600 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className={td}>
                        <button onClick={() => setOpenId(u.id)} className="cursor-pointer text-left font-medium hover:text-indigo-700 hover:underline dark:hover:text-indigo-300">
                          {u.fullName || '—'}
                        </button>
                        {u.studentCode && <div className="text-xs tabular-nums text-[var(--text-muted)]">{u.studentCode}</div>}
                      </td>
                      <td className={`${td} text-[var(--text-muted)]`}>{u.email}</td>
                      <td className={td}>
                        <Pill tone={ROLE_TONE[u.role] ?? 'slate'}>{ROLE_VI[u.role]}</Pill>
                      </td>
                      <td className={`${td} text-[var(--text-muted)]`}>{u.ageGroup ? ageGroupLabel(u.ageGroup) : '—'}</td>
                      <td className={td}>
                        <Pill tone={pill.tone}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isLocked(u) ? 'bg-rose-500' : 'bg-emerald-500'}`} aria-hidden="true" />
                          {pill.label}
                        </Pill>
                      </td>
                      <td className={`${td} whitespace-nowrap text-right`}>
                        <button onClick={() => setEditing(u)} className={btnGhost}>
                          <Pencil size={13} /> Sửa
                        </button>
                        <button
                          onClick={() => setConfirm({ kind: 'toggle', user: u })}
                          disabled={self || u.role === 'ADMIN'}
                          title={self ? 'Không thể tự khóa chính mình' : u.role === 'ADMIN' ? 'Không khóa tài khoản Admin' : undefined}
                          className={`${btnGhost} ${isLocked(u) ? '' : '!text-rose-700 hover:!bg-rose-50 dark:!text-rose-300 dark:hover:!bg-rose-500/10'}`}
                        >
                          {isLocked(u) ? <Unlock size={13} /> : <Lock size={13} />} {isLocked(u) ? 'Mở khóa' : 'Khóa'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {info && items.length > 0 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-sm text-[var(--text-muted)] dark:border-neutral-800">
            <span>{info.label}</span>
            <span className="flex gap-2">
              <button className={btnSecondary} disabled={!info.hasPrev} onClick={() => setPage((p) => p - 1)}>
                Trước
              </button>
              <button className={btnSecondary} disabled={!info.hasNext} onClick={() => setPage((p) => p + 1)}>
                Sau
              </button>
            </span>
          </div>
        )}
      </div>

      {selected.size > 0 && (
        <div
          role="toolbar"
          aria-label="Thao tác hàng loạt"
          className="fixed bottom-6 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 md:left-[calc(50%+var(--sidebar-w,240px)/2)]"
        >
          <span className="text-sm font-medium text-[var(--text-main)]">{selectionLabel(selected.size)}</span>
          <span className="flex flex-wrap items-center gap-2">
            <button onClick={() => setConfirm({ kind: 'bulk', isActive: false })} className={btnDanger}>
              <Lock size={14} /> Khóa tài khoản đã chọn
            </button>
            <button onClick={() => setConfirm({ kind: 'bulk', isActive: true })} className={btnSecondary}>
              <Unlock size={14} /> Mở khóa đã chọn
            </button>
            <button onClick={() => setSelected(new Set())} aria-label="Bỏ chọn tất cả" className="cursor-pointer rounded-md p-1.5 text-[var(--text-muted)] hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <X size={16} />
            </button>
          </span>
        </div>
      )}

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onDone={(m) => {
            setCreating(false);
            showToast(m, 'success');
            refreshAll();
          }}
        />
      )}
      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onDone={(m) => {
            setEditing(null);
            showToast(m, 'success');
            refreshAll();
          }}
          onRevoke={(u) => {
            setEditing(null);
            setRevoking(u);
          }}
        />
      )}
      {revoking && (
        <RevokeTeacherModal
          user={revoking}
          onClose={() => setRevoking(null)}
          onDone={(m) => {
            setRevoking(null);
            showToast(m, 'success');
            refreshAll();
          }}
        />
      )}
      {confirm?.kind === 'toggle' && (
        <ConfirmModal
          title={isLocked(confirm.user) ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
          danger={!isLocked(confirm.user)}
          confirmLabel={isLocked(confirm.user) ? 'Mở khóa' : 'Khóa tài khoản'}
          busy={toggle.isPending}
          onClose={() => setConfirm(null)}
          onConfirm={() => toggle.mutate(confirm.user)}
          message={
            isLocked(confirm.user) ? (
              <>
                <strong>{confirm.user.fullName || confirm.user.email}</strong> sẽ đăng nhập và sử dụng hệ thống trở lại.
              </>
            ) : (
              <>
                <strong>{confirm.user.fullName || confirm.user.email}</strong> sẽ bị đăng xuất ngay ở yêu cầu kế tiếp và không thể đăng nhập cho tới khi được mở khóa.
              </>
            )
          }
        />
      )}
      {confirm?.kind === 'bulk' && (
        <ConfirmModal
          title={confirm.isActive ? 'Mở khóa các tài khoản đã chọn?' : 'Khóa các tài khoản đã chọn?'}
          danger={!confirm.isActive}
          confirmLabel={confirm.isActive ? `Mở khóa ${selected.size} tài khoản` : `Khóa ${selected.size} tài khoản`}
          busy={bulk.isPending}
          onClose={() => setConfirm(null)}
          onConfirm={() => bulk.mutate(confirm.isActive)}
          message={
            confirm.isActive
              ? `${selectionLabel(selected.size)} sẽ được phép đăng nhập trở lại.`
              : `${selectionLabel(selected.size)} sẽ bị đăng xuất ngay và không thể đăng nhập cho tới khi được mở khóa. Tài khoản Admin và chính bạn được tự động bỏ qua.`
          }
        />
      )}
      <StudentProfileDrawer userId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
};

export default AdminUsersPage;
