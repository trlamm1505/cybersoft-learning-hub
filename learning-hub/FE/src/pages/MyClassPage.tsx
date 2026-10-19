import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  FileQuestion,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Trophy,
} from 'lucide-react';
import studentClassesApi from '../axios/studentClassesApi';
import classAssignmentsApi from '../axios/classAssignmentsApi';
import type { MyClass } from '../types/studentClasses';
import type { ClassAssignmentRow, ClassLeaderboard, ClassOverview } from '../types/classAssignments';
import { UserAvatar } from '../components/UserAvatar';
import { assignmentPath, dayHeading, formatVnDateTime, rankMedal, scoreText, STATE_LABEL } from '../common/classFormat';

const errText = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const AssignmentRow: React.FC<{ a: ClassAssignmentRow }> = ({ a }) => {
  const isCoding = a.type === 'CODING';
  const TypeIcon = isCoding ? Code2 : FileQuestion;
  return (
    <li
      className={`rounded-xl border px-4 py-3 ${
        a.state === 'EXPIRED' ? 'border-rose-300/60 bg-rose-50/40 dark:bg-rose-950/20' : 'border-[var(--border-color)] bg-[var(--bg-main)]'
      }`}
      data-state={a.state}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            isCoding ? 'bg-indigo-500/15 text-indigo-600' : 'bg-amber-500/15 text-amber-600'
          }`}
          aria-hidden="true"
        >
          <TypeIcon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[var(--text-main)]">{a.title}</span>
            <span className="rounded-full border border-[var(--border-color)] px-2 py-0.5 text-[11px] font-bold text-[var(--text-muted)]">
              {isCoding ? 'Coding' : `Trắc nghiệm${a.questionCount ? ` · ${a.questionCount} câu` : ''}`}
            </span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1"><Clock size={12} /> Bắt đầu: {formatVnDateTime(a.startAt)}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-main)]"><Clock size={12} /> Hạn chót: {formatVnDateTime(a.dueAt)}</span>
          </p>
          {isCoding && !a.done && !a.locked && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Bấm <strong>Run</strong> thử thoải mái, không trừ điểm. Mỗi lần <strong>Submit</strong> sai (WA/TLE/RE) bị trừ 1 điểm:
              hiện còn tối đa <strong>{a.potentialScore}/{a.maxPoints}</strong> điểm.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {a.state === 'DONE' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={14} /> ✅ {STATE_LABEL.DONE}
            </span>
          )}
          {a.state === 'EXPIRED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-400">
              <Lock size={13} /> {STATE_LABEL.EXPIRED}
            </span>
          )}
          {a.state === 'NOT_OPEN' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-bold text-[var(--text-muted)]">
              <Lock size={13} /> {STATE_LABEL.NOT_OPEN}
            </span>
          )}
          {(a.state === 'IN_PROGRESS' || a.state === 'NOT_STARTED') && (
            <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-bold text-sky-700 dark:text-sky-400">
              {STATE_LABEL[a.state]}
              {a.state === 'IN_PROGRESS' && a.wrongCount > 0 ? ` · sai ${a.wrongCount} lần` : ''}
            </span>
          )}

          {a.done && <span className="text-sm font-black text-[var(--text-main)]">{scoreText(a)}</span>}

          {a.locked ? (
            <button type="button" disabled className="cursor-not-allowed rounded-lg bg-[var(--border-color)] px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] opacity-70">
              {a.state === 'EXPIRED' ? 'Đã khóa' : 'Chưa mở'}
            </button>
          ) : a.state === 'DONE' ? null : (
            <Link to={assignmentPath(a)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white no-underline hover:bg-indigo-500">
              {a.state === 'IN_PROGRESS' ? 'Làm tiếp' : 'Làm bài'}
            </Link>
          )}
        </div>
      </div>
    </li>
  );
};

/** "Lớp học của tôi": thông tin lớp + giảng viên + tiến độ, bài được giao theo ngày (accordion), bảng xếp hạng thành viên. */
export const MyClassPage: React.FC = () => {
  const [classes, setClasses] = useState<MyClass[] | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [overview, setOverview] = useState<ClassOverview | null>(null);
  const [board, setBoard] = useState<ClassLeaderboard | null>(null);
  const [openDays, setOpenDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    studentClassesApi
      .getMyClasses()
      .then((list) => {
        if (!alive) return;
        setClasses(list);
        setClassId(list[0]?.id ?? null);
        if (list.length === 0) setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(errText(e, 'Không tải được danh sách lớp.'));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const [o, b] = await Promise.all([classAssignmentsApi.getOverview(id), classAssignmentsApi.getLeaderboard(id)]);
      setOverview(o);
      setBoard(b);
      // Mở sẵn ngày đầu tiên còn bài chưa hoàn thành (hoặc ngày cuối nếu đã xong hết).
      const first =
        o.days.find((d) => d.assignments.some((a) => !a.locked && !a.done)) ??
        o.days.find((d) => d.pendingCount > 0) ??
        o.days[o.days.length - 1];
      setOpenDays(new Set(first ? [first.date] : []));
    } catch (e) {
      setError(errText(e, 'Không tải được thông tin lớp học.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (classId) void load(classId);
  }, [classId, load]);

  const toggle = (date: string) =>
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--text-muted)]">
        <Loader2 className="mr-2 animate-spin" size={20} /> Đang tải lớp học...
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-500">
        <AlertTriangle size={18} /> {error}
      </div>
    );
  }
  if (classes && classes.length === 0) {
    return (
      <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center">
        <GraduationCap size={40} className="mx-auto mb-2 text-[var(--text-muted)]" />
        <h1 className="text-lg font-bold text-[var(--text-main)]">Bạn chưa tham gia lớp học nào</h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--text-muted)]">
          Nếu bạn là học viên của trung tâm, hãy liên hệ giảng viên hoặc quản trị viên để được thêm vào lớp. Trong lúc chờ, bạn vẫn luyện tập tự do ở mục Bài tập / Playground.
        </p>
      </section>
    );
  }
  if (!overview) return null;

  const { class: info, progress, myRank, days } = overview;

  return (
    <div className="space-y-6">
      {classes && classes.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Chọn lớp">
          {classes.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={c.id === classId}
              onClick={() => setClassId(c.id)}
              className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold ${c.id === classId ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)]'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Header thông tin lớp */}
      <section aria-label="Thông tin lớp" className="rounded-3xl border border-[var(--border-color)] bg-gradient-to-r from-indigo-500/10 via-sky-500/5 to-cyan-500/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-xl font-black text-[var(--text-main)] sm:text-2xl">
              <GraduationCap size={24} /> {info.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {info.code && (
                <span className="rounded-full border border-indigo-300 bg-indigo-50 px-2.5 py-1 font-mono font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Mã lớp: {info.code}
                </span>
              )}
              <span className="rounded-full border border-[var(--border-color)] px-2.5 py-1 font-semibold text-[var(--text-muted)]">{info.memberCount} thành viên</span>
            </div>
            {info.description && <p className="mt-2 text-sm text-[var(--text-muted)]">{info.description}</p>}
          </div>

          {info.teacher && (
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3" aria-label="Giảng viên">
              <UserAvatar user={{ fullName: info.teacher.name, email: info.teacher.email, avatar: info.teacher.avatar ?? undefined }} size={44} />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase text-[var(--text-muted)]">Giảng viên</div>
                <div className="truncate text-sm font-bold text-[var(--text-main)]">{info.teacher.name || 'Chưa cập nhật'}</div>
                {info.teacher.email && (
                  <a href={`mailto:${info.teacher.email}`} className="inline-flex items-center gap-1 truncate text-xs text-indigo-600 no-underline hover:underline dark:text-cyan-400">
                    <Mail size={12} /> {info.teacher.email}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-[var(--text-main)]">
              <span>Tiến độ hoàn thành chung</span>
              <span>{progress.done}/{progress.total} bài · {progress.percent}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--border-color)]" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--text-main)]">
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">Điểm của bạn</div>
              <div className="text-lg font-black">{progress.points}<span className="text-xs font-semibold text-[var(--text-muted)]">/{progress.maxPoints}</span></div>
            </div>
            {myRank && (
              <div>
                <div className="text-[11px] text-[var(--text-muted)]">Hạng trong lớp</div>
                <div className="text-lg font-black">{myRank.rank}<span className="text-xs font-semibold text-[var(--text-muted)]">/{myRank.of}</span></div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Bài được giao theo ngày */}
        <section aria-label="Bài tập được giao" className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--text-main)]">Bài tập được giao</h2>
          {days.length === 0 ? (
            <p className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 text-sm text-[var(--text-muted)]">Giảng viên chưa giao bài nào cho lớp này.</p>
          ) : (
            days.map((day) => {
              const open = openDays.has(day.date);
              return (
                <div key={day.date} className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => toggle(day.date)}
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left"
                  >
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="flex-1 text-sm font-bold text-[var(--text-main)]">{dayHeading(day)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${day.pendingCount === 0 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'}`}>
                      {day.doneCount}/{day.totalCount}
                    </span>
                  </button>
                  {open && (
                    <ul className="space-y-2 border-t border-[var(--border-color)] p-3">
                      {day.assignments.map((a) => (
                        <AssignmentRow key={a.id} a={a} />
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </section>

        {/* Bảng xếp hạng thành viên */}
        <aside aria-label="Bảng xếp hạng lớp" className="h-fit rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[var(--text-main)]">
            <Trophy size={18} className="text-amber-500" /> Bảng xếp hạng lớp
          </h2>
          <p className="mb-3 text-[11px] text-[var(--text-muted)]">Theo tổng điểm tích lũy. Bằng điểm thì ai nộp bài sớm hơn xếp trước.</p>
          <ol className="space-y-1.5">
            {(board?.rows ?? []).map((r) => (
              <li
                key={r.userId}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm ${r.isMe ? 'border border-indigo-400 bg-indigo-500/10' : 'border border-transparent'}`}
              >
                <span className="w-7 shrink-0 text-center font-black text-[var(--text-main)]">{rankMedal(r.rank) || r.rank}</span>
                <span className="min-w-0 flex-1 break-words font-semibold text-[var(--text-main)]">
                  {r.name}
                  {r.isMe ? ' (Bạn)' : ''}
                </span>
                <span className="shrink-0 font-black text-[var(--text-main)]">{r.points}<span className="ml-0.5 text-[10px] font-semibold text-[var(--text-muted)]">đ</span></span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
};

export default MyClassPage;
