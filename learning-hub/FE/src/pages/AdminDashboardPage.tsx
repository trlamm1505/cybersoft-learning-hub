import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import adminClassesApi from '../axios/adminClassesApi';
import adminUsersApi from '../axios/adminUsersApi';
import type { AdminClassSummary } from '../types/teacherAnalytics';
import { adminOverview } from './adminDashboardModel';

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const Stat: React.FC<{ label: string; value: number; note?: string }> = ({ label, value, note }) => (
  <div className="min-w-[8rem] flex-1 px-4 py-3">
    <div className="text-xs text-[var(--text-muted)]">{label}</div>
    <div className="text-2xl font-semibold tabular-nums text-[var(--text-main)]">{value}</div>
    {note && <div className="text-xs text-[var(--text-muted)]">{note}</div>}
  </div>
);

/** Tổng quan Admin: số lớp, giảng viên, học viên trong lớp và các lớp cần chú ý. */
export const AdminDashboardPage: React.FC = () => {
  const [classes, setClasses] = useState<AdminClassSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<{ students: number; teachers: number; locked: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Chỉ cần tổng số nên xin 1 dòng cho mỗi bộ lọc.
    Promise.all([
      adminUsersApi.list({ role: 'STUDENT', pageSize: 1 }),
      adminUsersApi.list({ role: 'TEACHER', pageSize: 1 }),
      adminUsersApi.list({ status: 'LOCKED', pageSize: 1 }),
    ])
      .then(([s, t, l]) => !cancelled && setPeople({ students: s.total, teachers: t.total, locked: l.total }))
      .catch(() => !cancelled && setPeople(null));
    adminClassesApi
      .list()
      .then((list) => !cancelled && setClasses(list))
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err, 'Không tải được số liệu.'));
        setClasses([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const o = useMemo(() => adminOverview(classes ?? []), [classes]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-xl font-semibold text-[var(--text-main)]">Tổng quan hệ thống</h1>
      {error && <p className="text-sm text-rose-500">{error}</p>}

      {classes === null ? (
        <div className="flex items-center py-8 text-sm text-[var(--text-muted)]">
          <Loader2 className="mr-2 animate-spin" size={16} /> Đang tải...
        </div>
      ) : (
        <>
          <section
            aria-label="Chỉ số"
            className="flex flex-wrap divide-x divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800"
          >
            {people && <Stat label="Học viên" value={people.students} />}
            {people && <Stat label="Giảng viên" value={people.teachers} />}
            {people && <Stat label="Tài khoản bị khóa" value={people.locked} />}
            <Stat label="Lớp học" value={o.totalClasses} note={`${o.activeClasses} đang mở, ${o.archivedClasses} lưu trữ`} />
            <Stat label="Chỗ học viên trong lớp" value={o.studentSeats} />
          </section>

          {o.totalClasses === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Chưa có lớp nào.{' '}
              <Link to="/admin/classes" className="text-indigo-600 underline dark:text-indigo-400">
                Tạo lớp đầu tiên
              </Link>
            </p>
          ) : (
            <section aria-label="Lớp cần chú ý">
              <h2 className="mb-1 text-sm font-medium text-[var(--text-main)]">Cần chú ý</h2>
              {o.attention.length === 0 ? (
                <p className="py-2 text-sm text-[var(--text-muted)]">Mọi lớp đang hoạt động đều đã có học viên và giảng viên.</p>
              ) : (
                <ul>
                  {o.attention.map((a) => (
                    <li
                      key={a.cls.id}
                      className="flex items-center justify-between border-t border-[var(--border-color)] py-2 text-sm text-[var(--text-main)]"
                    >
                      <span>
                        {a.cls.name}
                        <span className="ml-2 text-xs text-[var(--text-muted)]">{a.reasons.join(', ')}</span>
                      </span>
                      <Link to="/admin/classes" className="text-xs text-[var(--text-muted)] underline">
                        Quản lý
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
