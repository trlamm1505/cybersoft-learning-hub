import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, GraduationCap } from 'lucide-react';
import studentClassesApi from '../axios/studentClassesApi';
import type { AssignmentStatus, MyClass } from '../types/studentClasses';
import { actionLabel, exercisePath, passedPercent, sortAssignments, STATUS_LABEL } from '../pages/studentClassesModel';

const STATUS_STYLE: Record<AssignmentStatus, string> = {
  NOT_STARTED: 'border-[var(--border-color)] text-[var(--text-muted)]',
  ATTEMPTED: 'border-amber-500/40 text-amber-700 dark:text-amber-400',
  PASSED: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400',
};

/** "Lớp học của tôi": lớp học viên đang tham gia, bấm để xem bài giảng viên giao và vào làm. */
export const MyClassesPanel: React.FC = () => {
  const [classes, setClasses] = useState<MyClass[] | null>(null);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    studentClassesApi
      .getMyClasses()
      .then((list) => {
        if (!alive) return;
        setClasses(list);
        if (list.length === 1) setOpenId(list[0].id);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  // Chưa tải xong hoặc lỗi mạng: không chiếm chỗ. Chưa vào lớp nào: báo rõ đây là lộ trình tự do.
  if (error || !classes) return null;
  if (classes.length === 0) {
    return (
      <section aria-label="Lớp học của tôi" className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-main)]">
          <GraduationCap size={16} strokeWidth={2.2} /> Lớp học của tôi
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          Bạn chưa tham gia lớp học nào. Các bài tập bên dưới là lộ trình tự do. Nếu bạn là học viên của trung tâm, vui lòng liên hệ quản trị viên/giảng viên để được thêm vào lớp.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Lớp học của tôi" className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-main)]">
        <GraduationCap size={16} strokeWidth={2.2} /> Lớp học của tôi
      </h2>
      <ul className="mt-3 divide-y divide-[var(--border-color)] border-t border-[var(--border-color)]">
        {classes.map((c) => {
          const open = openId === c.id;
          const pct = passedPercent(c.progress.passed, c.progress.total);
          return (
            <li key={c.id}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : c.id)}
                className="flex w-full cursor-pointer items-center gap-3 py-3 text-left"
              >
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[var(--text-main)]">{c.name}</span>
                  <span className="block truncate text-xs text-[var(--text-muted)]">
                    {c.teacher?.name ? `Giảng viên: ${c.teacher.name}` : 'Chưa có giảng viên'}
                    {c.description ? ` · ${c.description}` : ''}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs font-bold text-[var(--text-muted)]">
                  {c.progress.passed}/{c.progress.total} bài đạt
                  <span className="mt-1 block h-1 w-24 overflow-hidden rounded-full bg-[var(--border-color)]">
                    <span className="block h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </span>
                </span>
              </button>
              {open && (
                <div className="pb-3 pl-7">
                  {c.exercises.length === 0 ? (
                    <p className="py-2 text-xs text-[var(--text-muted)]">Giảng viên chưa giao bài nào cho lớp này.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {sortAssignments(c.exercises).map((e) => (
                        <li key={e.slug} className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-color)] px-3 py-2">
                          <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-main)]">{e.title}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[e.status]}`}>
                            {STATUS_LABEL[e.status]}
                            {e.status === 'ATTEMPTED' ? ` · ${e.attempts} lần` : ''}
                          </span>
                          <Link
                            to={exercisePath(e.type, e.slug)}
                            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-500"
                          >
                            {actionLabel(e.status)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default MyClassesPanel;
