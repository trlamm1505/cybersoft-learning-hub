import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Clock,
  Code2,
  FileEdit,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import type { ContestItem } from '../types/contest';
import { contestApi } from '../axios/contestApi';
import { useToast } from './Toast';
import { ContestEditor } from './contest-manager/ContestEditor';
import { ContestResultsPanel } from './contest-manager/ContestResultsPanel';
import { contestPhase, PHASE_LABEL, summarizeProblems, type ContestPhase } from './contest-manager/contestForm';

type View = { kind: 'list' } | { kind: 'edit'; contest: ContestItem | null } | { kind: 'results'; contest: ContestItem };

const FILTERS: Array<{ key: 'ALL' | ContestPhase; label: string }> = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'ONGOING', label: 'Đang diễn ra' },
  { key: 'UPCOMING', label: 'Sắp diễn ra' },
  { key: 'ENDED', label: 'Đã kết thúc' },
  { key: 'DRAFT', label: 'Bản nháp' },
];

const PHASE_TONE: Record<ContestPhase, string> = {
  DRAFT: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  UPCOMING: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  ONGOING: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  ENDED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

/**
 * Quản lý cuộc thi cho giảng viên: danh sách → tạo/sửa theo 3 bước (đề thi phối
 * hợp trắc nghiệm và Code Playground) → xem kết quả và xem xét tính trung thực.
 */
export const TeacherContestAuthoring: React.FC = () => {
  const { showToast } = useToast();
  const [contests, setContests] = useState<ContestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: 'list' });
  const [filter, setFilter] = useState<'ALL' | ContestPhase>('ALL');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await contestApi.getContests();
      setContests(Array.isArray(list) ? list : []);
    } catch {
      setLoadError('Không tải được danh sách cuộc thi. Kiểm tra kết nối máy chủ rồi thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const withPhase = useMemo(() => contests.map((c) => ({ c, phase: contestPhase(c) })), [contests]);
  const counts = useMemo(() => {
    const out: Record<string, number> = { ALL: withPhase.length };
    for (const { phase } of withPhase) out[phase] = (out[phase] ?? 0) + 1;
    return out;
  }, [withPhase]);
  const visible = withPhase.filter(({ phase }) => filter === 'ALL' || phase === filter);

  const handleDelete = async (c: ContestItem) => {
    if (!c._id) return;
    const warn = c.registrationsCount
      ? `Cuộc thi "${c.title}" đã có ${c.registrationsCount} thí sinh đăng ký. Xóa sẽ xóa luôn bài nộp và kết quả của họ, không khôi phục được. Vẫn xóa?`
      : `Xóa cuộc thi "${c.title}"?`;
    if (!window.confirm(warn)) return;
    setDeleting(c._id);
    try {
      await contestApi.deleteContest(c._id);
      showToast(`Đã xóa cuộc thi "${c.title}".`, 'success');
      await load();
    } catch (err) {
      showToast((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Xóa cuộc thi thất bại.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  if (view.kind === 'edit') {
    return (
      <ContestEditor
        contest={view.contest}
        onClose={() => setView({ kind: 'list' })}
        onSaved={() => {
          setView({ kind: 'list' });
          load();
        }}
      />
    );
  }

  if (view.kind === 'results') {
    return <ContestResultsPanel contest={view.contest} onBack={() => setView({ kind: 'list' })} />;
  }

  return (
    <div className="space-y-5 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-[var(--text-main)]">
            <Trophy size={20} /> Quản lý cuộc thi
          </h2>
          <p className="text-xs text-[var(--text-muted)]">Tạo cuộc thi gồm trắc nghiệm và bài code, theo dõi kết quả và tính trung thực.</p>
        </div>
        <button
          type="button"
          onClick={() => setView({ kind: 'edit', contest: null })}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-none bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus size={14} /> Tạo cuộc thi
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc cuộc thi">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold ${
              filter === f.key
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-indigo-400'
            }`}
          >
            {f.label} ({counts[f.key] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] py-12 text-xs text-[var(--text-muted)]">
          <Loader2 className="mr-2 animate-spin" size={14} /> Đang tải cuộc thi...
        </div>
      ) : loadError ? (
        <div className="space-y-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <p className="text-sm text-rose-500">{loadError}</p>
          <button
            type="button"
            onClick={load}
            className="cursor-pointer rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-xs font-bold text-[var(--text-main)]"
          >
            Thử lại
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] py-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            {contests.length === 0 ? 'Bạn chưa có cuộc thi nào.' : 'Không có cuộc thi nào trong mục này.'}
          </p>
          {contests.length === 0 && (
            <button
              type="button"
              onClick={() => setView({ kind: 'edit', contest: null })}
              className="cursor-pointer rounded-xl border-none bg-indigo-600 px-4 py-2 text-xs font-black text-white"
            >
              Tạo cuộc thi đầu tiên
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map(({ c, phase }) => {
            const stats = summarizeProblems(c.problems ?? []);
            return (
              <li
                key={c._id || c.slug}
                className="flex flex-col gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-sm md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${PHASE_TONE[phase]}`}>{PHASE_LABEL[phase]}</span>
                    {c.integrityEnabled !== false && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                        <ShieldCheck size={12} /> Có giám sát
                      </span>
                    )}
                  </div>
                  <h3 className="truncate text-base font-extrabold tracking-tight text-[var(--text-main)]" title={c.title}>
                    {c.title}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={12} /> {fmt(c.startTime)} → {fmt(c.endTime)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} /> {c.durationMinutes ?? 90} phút/thí sinh
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileEdit size={12} /> {stats.quiz} trắc nghiệm
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Code2 size={12} /> {stats.coding} code · {stats.totalPoints} điểm
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} /> {c.registrationsCount ?? 0} đăng ký
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {phase !== 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => setView({ kind: 'results', contest: c })}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-xs font-bold text-[var(--text-main)] hover:border-indigo-400"
                    >
                      <BarChart3 size={13} /> Kết quả
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setView({ kind: 'edit', contest: c })}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-none bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                  >
                    <Pencil size={13} /> Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    disabled={deleting === c._id}
                    aria-label={`Xóa ${c.title}`}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 bg-red-600/10 px-3 py-2 text-xs font-bold text-red-700 dark:text-red-400 hover:bg-red-600 hover:text-white disabled:opacity-60 dark:border-red-900"
                  >
                    {deleting === c._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default TeacherContestAuthoring;
