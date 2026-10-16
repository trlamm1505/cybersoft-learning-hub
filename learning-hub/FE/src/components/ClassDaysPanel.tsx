import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Loader2, Plus, Trash2 } from 'lucide-react';
import teacherClassAssignmentsApi from '../axios/teacherClassAssignmentsApi';
import { AddToDayDialog } from './AddToDayDialog';
import { hairline } from './adminStyles';
import type { TeacherClassDays, TeacherDay, AssignmentWindow } from '../types/classDays';
import { dayTitle, nextDayDate, TYPE_BADGE, WINDOW_LABEL } from '../pages/classDaysModel';

const WINDOW_STYLE: Record<AssignmentWindow, string> = {
  OPEN: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  EXPIRED: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  UPCOMING: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
};

const fmt = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

/**
 * Tab "Bài tập & Giao bài" của lớp K6-9 / K10-12, tổ chức THEO NGÀY HỌC (Ngày 1, 2, 3...) giống hệt phía học viên.
 * Mỗi bài có huy hiệu 📝 Trắc nghiệm / 💻 Code, hạn nộp và trạng thái; giảng viên thêm ngày mới, thêm bài vào từng ngày từ ngân hàng đề.
 */
export const ClassDaysPanel: React.FC<{ classId: string; onChanged?: () => void }> = ({ classId, onChanged }) => {
  const [data, setData] = useState<TeacherClassDays | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extra, setExtra] = useState<string[]>([]);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<{ date: string; dayNumber: number } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    return teacherClassAssignmentsApi
      .getDays(classId)
      .then((d) => {
        setData(d);
        setExtra((cur) => cur.filter((date) => !d.days.some((x) => x.date === date)));
        return d;
      })
      .catch(() => setError('Không tải được bài của lớp.'));
  }, [classId]);

  useEffect(() => {
    setData(null);
    setError(null);
    setExtra([]);
    setAdding(null);
    void load().then((d) => {
      // Mở sẵn ngày cuối cùng.
      if (d && d.days.length) setOpen(new Set([d.days[d.days.length - 1].date]));
    });
  }, [classId, load]);

  if (error) return <p className="text-sm text-rose-500">{error}</p>;
  if (!data) {
    return (
      <div className="flex items-center py-6 text-sm text-[var(--text-muted)]">
        <Loader2 size={14} className="mr-2 animate-spin" /> Đang tải bài của lớp...
      </div>
    );
  }

  const readOnly = data.archived;
  // Ngày mới chưa có bài chỉ tồn tại trên màn hình; lưu bài đầu tiên thì ngày được tạo thật (cùng cách học viên thấy).
  const shown: TeacherDay[] = [
    ...data.days,
    ...extra.map((date, i) => ({ date, dayNumber: data.days.length + i + 1, assignments: [] })),
  ];

  const toggle = (date: string) =>
    setOpen((cur) => {
      const next = new Set(cur);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });

  const addDay = () => {
    const date = nextDayDate(data.days, extra);
    setExtra((cur) => [...cur, date]);
    setOpen((cur) => new Set(cur).add(date));
  };

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Xóa bài "${title}" khỏi lớp? Kết quả học viên đã làm cho bài này sẽ không còn được tính.`)) return;
    setBusy(id);
    try {
      await teacherClassAssignmentsApi.remove(classId, id);
      await load();
      onChanged?.();
    } catch {
      setError('Không xóa được bài.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-[var(--text-main)]">Bài học theo ngày ({data.days.length} ngày)</h2>
        {!readOnly && (
          <button onClick={addDay} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus size={14} /> Thêm ngày mới
          </button>
        )}
      </div>
      {readOnly && <p className="text-xs text-[var(--text-muted)]">Lớp đã lưu trữ: chỉ xem lại lịch sử, không thêm hay xóa bài.</p>}

      {shown.length === 0 && <p className={`rounded-lg border p-4 text-sm text-[var(--text-muted)] ${hairline}`}>Lớp chưa có ngày học nào. Bấm &quot;Thêm ngày mới&quot; để bắt đầu.</p>}

      {shown.map((day) => {
        const isOpen = open.has(day.date);
        return (
          <section key={day.date} aria-label={dayTitle(day)} className={`overflow-hidden rounded-lg border ${hairline}`}>
            <button onClick={() => toggle(day.date)} aria-expanded={isOpen} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900">
              <ChevronDown size={16} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
              <span className="flex-1 text-sm font-semibold text-[var(--text-main)]">{dayTitle(day)}</span>
              <span className="text-xs text-[var(--text-muted)]">{day.assignments.length} bài</span>
            </button>
            {isOpen && (
              <div className={`space-y-2 border-t p-3 ${hairline}`}>
                {day.assignments.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">Ngày này chưa có bài. Bấm &quot;Thêm bài vào ngày&quot; để chọn từ ngân hàng đề.</p>
                ) : (
                  <ul className="space-y-2">
                    {day.assignments.map((a) => (
                      <li key={a.id} className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-2 ${hairline}`}>
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                          {TYPE_BADGE[a.type].icon} {TYPE_BADGE[a.type].label}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-main)]" title={a.title}>
                          {a.title}
                        </span>
                        <span className="text-xs tabular-nums text-[var(--text-muted)]">Hạn nộp {fmt(a.dueAt)}</span>
                        <span className="text-xs tabular-nums text-[var(--text-muted)]">
                          {a.doneCount}/{a.memberCount} đã xong
                        </span>
                        <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${WINDOW_STYLE[a.window]}`}>{WINDOW_LABEL[a.window]}</span>
                        {!readOnly && (
                          <button onClick={() => void remove(a.id, a.title)} disabled={busy === a.id} aria-label={`Xóa bài ${a.title}`} className="cursor-pointer text-[var(--text-muted)] hover:text-rose-600 disabled:opacity-50">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {!readOnly && (
                  <button onClick={() => setAdding({ date: day.date, dayNumber: day.dayNumber })} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-indigo-300 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950">
                    <Plus size={12} /> Thêm bài vào ngày
                  </button>
                )}
              </div>
            )}
          </section>
        );
      })}

      {adding && (
        <AddToDayDialog
          classId={classId}
          day={adding}
          band={data?.band ?? null}
          onClose={() => setAdding(null)}
          onSaved={() => {
            setAdding(null);
            void load();
            onChanged?.();
          }}
        />
      )}
    </div>
  );
};

export default ClassDaysPanel;
