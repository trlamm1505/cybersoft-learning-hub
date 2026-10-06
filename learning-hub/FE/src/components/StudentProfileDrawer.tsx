import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import adminUsersApi from '../axios/adminUsersApi';
import { formatDateTime, formatRate, KIND_VI, RESULT_VI, ROLE_VI, STATUS_VI } from '../pages/adminModel';
import type { AdminUserProfile } from '../types/teacherAnalytics';
import { ActivityHeatmap } from './profile/ActivityHeatmap';
import { UserAvatar } from './UserAvatar';

const hairline = 'border-neutral-200 dark:border-neutral-800';
const label = 'text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]';

const Field: React.FC<{ name: string; children: React.ReactNode }> = ({ name, children }) => (
  <div className="min-w-0">
    <div className={label}>{name}</div>
    <div className="truncate text-sm font-medium text-[var(--text-main)]">{children}</div>
  </div>
);

const Block: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className={`border-t py-4 ${hairline}`}>
    <h3 className={`${label} mb-2`}>{title}</h3>
    {children}
  </section>
);

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

interface Props {
  userId: string | null;
  onClose: () => void;
}

/** Hồ sơ người dùng dạng slide-over từ cạnh phải: thông tin, lớp, tiến độ, bài nộp gần nhất, hoạt động. */
export const StudentProfileDrawer: React.FC<Props> = ({ userId, onClose }) => {
  const [loaded, setLoaded] = useState<{ id: string; profile: AdminUserProfile | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    adminUsersApi
      .profile(userId)
      .then((profile) => !cancelled && setLoaded({ id: userId, profile, error: null }))
      .catch((err) => !cancelled && setLoaded({ id: userId, profile: null, error: errorMessage(err, 'Không tải được hồ sơ.') }));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [userId, onClose]);

  if (!userId) return null;
  const current = loaded?.id === userId ? loaded : null;
  const p = current?.profile ?? null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Hồ sơ người dùng">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto border-l bg-white p-5 shadow-lg dark:bg-neutral-950 ${hairline}`}
        style={{ animation: 'adminDrawerIn 160ms ease-out' }}
      >
        <style>{'@keyframes adminDrawerIn{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}'}</style>
        <button onClick={onClose} aria-label="Đóng hồ sơ" className="absolute right-3 top-3 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)]">
          <X size={18} />
        </button>

        {!current ? (
          <div className="flex items-center py-8 text-sm text-[var(--text-muted)]">
            <Loader2 className="mr-2 animate-spin" size={14} /> Đang tải...
          </div>
        ) : current.error || !p ? (
          <p role="alert" className="py-8 text-sm text-rose-500">
            {current.error}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3 pb-4 pr-6">
              <UserAvatar user={{ fullName: p.user.fullName, email: p.user.email, avatar: p.user.avatar ?? undefined }} size={56} />
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-[var(--text-main)]">{p.user.fullName || p.user.email}</div>
                <div className="truncate text-xs text-[var(--text-muted)]">{p.user.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pb-4">
              <Field name="Mã số">{p.user.studentCode ?? '—'}</Field>
              <Field name="Vai trò">{ROLE_VI[p.user.role]}</Field>
              <Field name="Trạng thái">{STATUS_VI[p.user.status]}</Field>
              <Field name="Ngày tạo">{formatDateTime(p.user.createdAt)}</Field>
              {p.user.ageGroup && <Field name="Nhóm tuổi">{p.user.ageGroup}</Field>}
            </div>

            <Block title={p.user.role === 'TEACHER' ? 'Lớp phụ trách' : 'Lớp đang tham gia'}>
              {p.classes.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">{p.user.role === 'TEACHER' ? 'Chưa phụ trách lớp nào.' : 'Chưa tham gia lớp nào.'}</p>
              ) : (
                <ul>
                  {p.classes.map((c) => (
                    <li key={c.id} className={`flex items-baseline justify-between gap-3 border-t py-1.5 text-sm first:border-t-0 ${hairline}`}>
                      <span className="min-w-0 truncate text-[var(--text-main)]">
                        {c.name}
                        {c.archived && <span className="ml-1.5 text-[11px] text-[var(--text-muted)]">lưu trữ</span>}
                        {c.teacher && <span className="ml-2 text-xs text-[var(--text-muted)]">{c.teacher}</span>}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-[var(--text-muted)]">
                        {c.assigned !== null
                          ? `${c.passed}/${c.assigned} bài · ${formatRate(c.completionRate)}`
                          : `${c.students} học viên · ${c.exercises} bài`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Block>

            {p.stats && (
              <>
                <Block title="Tiến độ học tập">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <Field name="Tổng lượt nộp">{p.stats.totalSubmissions}</Field>
                    <Field name="Bài đã làm">{p.stats.attemptedExercises}</Field>
                    <Field name="Bài đạt">{p.stats.passedExercises}</Field>
                    <Field name="Tỷ lệ đạt">{formatRate(p.stats.passRate)}</Field>
                  </div>
                </Block>

                <Block title="Bài nộp gần nhất">
                  {p.recent.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">Chưa có bài nộp.</p>
                  ) : (
                    <ul>
                      {p.recent.map((r, i) => (
                        <li key={`${r.at}-${i}`} className={`flex items-baseline justify-between gap-3 border-t py-1.5 text-sm first:border-t-0 ${hairline}`}>
                          <span className="min-w-0 truncate text-[var(--text-main)]">
                            {r.title}
                            <span className="ml-2 text-[11px] text-[var(--text-muted)]">{KIND_VI[r.kind] ?? r.kind}</span>
                          </span>
                          <span className="shrink-0 text-xs text-[var(--text-muted)]">
                            <span className={r.status === 'PASSED' ? 'text-emerald-600 dark:text-emerald-400' : ''}>{RESULT_VI[r.status]}</span>
                            {' · '}
                            {formatDateTime(r.at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Block>

                <Block title="Hoạt động">
                  <ActivityHeatmap days={p.activity?.days ?? []} allowSample={false} />
                </Block>
              </>
            )}
          </>
        )}
      </aside>
    </div>
  );
};

export default StudentProfileDrawer;
