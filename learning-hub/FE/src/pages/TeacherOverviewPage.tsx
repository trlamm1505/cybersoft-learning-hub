import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import teacherAnalyticsApi from '../axios/teacherAnalyticsApi';
import { hairline } from '../components/adminStyles';
import type { TeacherClassSummary } from '../types/teacherAnalytics';
import { ageGroupLabel, NO_CLASS_MESSAGE, totalPending, totalStudents } from './teacherClassesModel';

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className={`min-w-[8rem] flex-1 rounded-lg border px-4 py-3 ${hairline}`}>
    <div className="text-xs text-[var(--text-muted)]">{label}</div>
    <div className="text-2xl font-semibold tabular-nums text-[var(--text-main)]">{value}</div>
  </div>
);

/** Tab "Tổng quan": chỉ số gộp của các lớp phụ trách và bảng lối tắt vào từng lớp (cảnh báo liêm chính nằm ở mục Chấm bài). */
export const TeacherOverviewPage: React.FC = () => {
  const [classes, setClasses] = useState<TeacherClassSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    teacherAnalyticsApi
      .getClasses()
      .then((list) => !cancelled && setClasses(list))
      .catch(() => {
        if (cancelled) return;
        setError('Không tải được danh sách lớp.');
        setClasses([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-[var(--text-main)]">Tổng quan</h1>
      {error && <p className="text-sm text-rose-500">{error}</p>}

      {classes === null ? (
        <div className="flex items-center py-8 text-sm text-[var(--text-muted)]">
          <Loader2 className="mr-2 animate-spin" size={16} /> Đang tải...
        </div>
      ) : classes.length === 0 ? (
        !error && <p className="py-8 text-sm text-[var(--text-muted)]">{NO_CLASS_MESSAGE}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <Stat label="Lớp phụ trách" value={classes.length} />
            <Stat label="Học viên" value={totalStudents(classes)} />
            <Stat label="Bài chờ chấm" value={totalPending(classes)} />
          </div>
          <section aria-label="Lớp phụ trách" className={`overflow-x-auto rounded-lg border ${hairline}`}>
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs text-[var(--text-muted)]">
                  <th className="px-3 py-2 font-medium">Lớp</th>
                  <th className="px-3 py-2 font-medium">Khối</th>
                  <th className="px-3 py-2 text-right font-medium">Học viên</th>
                  <th className="px-3 py-2 text-right font-medium">Chờ chấm</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id} className={`border-t text-sm text-[var(--text-main)] ${hairline}`}>
                    <td className="px-3 py-2">
                      <Link to={`/teacher/classes?classId=${encodeURIComponent(c.id)}`} className="text-indigo-600 hover:underline">
                        {c.code ? `${c.code} · ` : ''}
                        {c.name}
                      </Link>
                      {c.status === 'ARCHIVED' && <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">Đã lưu trữ</span>}
                    </td>
                    <td className="px-3 py-2">{ageGroupLabel(c.ageGroup)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.studentCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.pendingSubmissions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
};

export default TeacherOverviewPage;
