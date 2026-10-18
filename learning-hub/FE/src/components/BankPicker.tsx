import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import teacherClassAssignmentsApi from '../axios/teacherClassAssignmentsApi';
import { control, hairline, selectControl } from './adminStyles';
import type { BankBand, BankExercise, BankQuestion, Difficulty, Paged } from '../types/classDays';
import { DIFFICULTY_LABEL, pageLabel, toggleId } from '../pages/classDaysModel';

const DIFF_STYLE: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  HARD: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
};

const DiffBadge: React.FC<{ d: string | null }> = ({ d }) =>
  d ? <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${DIFF_STYLE[d] ?? ''}`}>{DIFFICULTY_LABEL[d] ?? d}</span> : null;

interface Props {
  type: 'CODING' | 'QUIZ';
  /** CODING: slug đã chọn (một bài); QUIZ: các id câu đã chọn. */
  selectedSlug: string;
  selectedIds: string[];
  onPickExercise: (e: BankExercise) => void;
  onToggleQuestion: (id: string) => void;
  /** Khối của lớp: tab lọc khối mặc định theo khối này. */
  defaultBand?: BankBand | null;
}

export const BAND_TABS: Array<{ value: BankBand | ''; label: string }> = [
  { value: '', label: 'Tất cả' },
  { value: '6-9', label: 'Khối 6–9' },
  { value: '10-12', label: 'Khối 10–12' },
];

/**
 * Chọn bài từ ngân hàng đề: tìm theo tên, lọc độ khó, PHÂN TRANG 10 bài/trang (không tải cả danh sách dài).
 * Bài code chọn một; câu trắc nghiệm chọn nhiều, lựa chọn được giữ khi chuyển trang.
 */
export const BankPicker: React.FC<Props> = ({ type, selectedSlug, selectedIds, onPickExercise, onToggleQuestion, defaultBand }) => {
  const [band, setBand] = useState<BankBand | ''>(defaultBand ?? '');
  const [q, setQ] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [page, setPage] = useState(1);
  // Kết quả kèm LOẠI bài đã tải: khi đổi tab Code <-> Trắc nghiệm, một lần render chạy với loại mới trong lúc dữ liệu vẫn của loại cũ
  // (setData(null) chỉ chạy sau render) nên bài Code bị vẽ như câu hỏi (qs.id undefined => thiếu key, nháy sai nội dung).
  const [loaded, setLoaded] = useState<{ type: Props['type']; res: Paged<BankExercise | BankQuestion> } | null>(null);
  const data = loaded && loaded.type === type ? loaded.res : null;
  const [error, setError] = useState<string | null>(null);

  // Đổi từ khóa/độ khó/loại bài thì về trang 1.
  useEffect(() => setPage(1), [q, difficulty, type, band]);

  useEffect(() => {
    let cancelled = false;
    setLoaded(null);
    setError(null);
    const t = setTimeout(() => {
      const load = type === 'CODING' ? teacherClassAssignmentsApi.catalogExercises({ q, difficulty, band, page, pageSize: 10 }) : teacherClassAssignmentsApi.catalogQuestions({ q, difficulty, band, page, pageSize: 10 });
      load
        .then((r) => !cancelled && setLoaded({ type, res: r as Paged<BankExercise | BankQuestion> }))
        .catch(() => !cancelled && setError('Không tải được ngân hàng đề.'));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [type, q, difficulty, band, page]);

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Lọc theo khối" className="flex gap-1.5">
        {BAND_TABS.map((t) => (
          <button key={t.value || 'all'} role="tab" aria-selected={band === t.value} onClick={() => setBand(t.value)} className={`cursor-pointer rounded-full px-3 py-1 text-xs ${band === t.value ? 'bg-indigo-600 font-medium text-white' : 'border border-neutral-300 text-[var(--text-main)] dark:border-neutral-700'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={type === 'CODING' ? 'Tìm bài theo tên...' : 'Tìm câu theo nội dung, chủ đề...'} aria-label="Tìm trong ngân hàng đề" className={`${control} w-full pl-8`} />
        </div>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | '')} aria-label="Lọc theo độ khó" className={selectControl}>
          <option value="">Mọi độ khó</option>
          <option value="EASY">Dễ</option>
          <option value="MEDIUM">Trung bình</option>
          <option value="HARD">Khó</option>
        </select>
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}
      {data === null && !error ? (
        <div className="flex items-center py-4 text-sm text-[var(--text-muted)]">
          <Loader2 size={14} className="mr-2 animate-spin" /> Đang tải...
        </div>
      ) : data && data.items.length === 0 ? (
        <p className="py-3 text-sm text-[var(--text-muted)]">Không có bài nào khớp.</p>
      ) : data ? (
        <ul className={`divide-y rounded-lg border ${hairline} divide-neutral-200 dark:divide-neutral-800`} aria-label="Danh sách ngân hàng đề">
          {type === 'CODING'
            ? (data.items as BankExercise[]).map((e) => (
                <li key={e.slug}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900">
                    <input type="radio" name="bank-exercise" checked={selectedSlug === e.slug} onChange={() => onPickExercise(e)} />
                    <span className="min-w-0 flex-1 truncate text-[var(--text-main)]">{e.title}</span>
                    {e.band && <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">K{e.band}</span>}
                    <DiffBadge d={e.difficulty} />
                  </label>
                </li>
              ))
            : (data.items as BankQuestion[]).map((qs) => (
                <li key={qs.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900">
                    <input type="checkbox" checked={selectedIds.includes(qs.id)} onChange={() => onToggleQuestion(qs.id)} />
                    <span className="min-w-0 flex-1 truncate text-[var(--text-main)]" title={qs.content}>
                      {qs.content}
                    </span>
                    {qs.category && <span className="text-[10px] text-[var(--text-muted)]">{qs.category}</span>}
                    <DiffBadge d={qs.difficulty} />
                  </label>
                </li>
              ))}
        </ul>
      ) : null}

      {data && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            {pageLabel(data.page, data.totalPages, data.total)}
            {type === 'QUIZ' && ` · đã chọn ${selectedIds.length} câu`}
          </span>
          <span className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={data.page <= 1} aria-label="Trang trước" className="flex cursor-pointer items-center rounded border border-neutral-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700">
              <ChevronLeft size={14} /> Trước
            </button>
            <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={data.page >= data.totalPages} aria-label="Trang sau" className="flex cursor-pointer items-center rounded border border-neutral-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700">
              Sau <ChevronRight size={14} />
            </button>
          </span>
        </div>
      )}
    </div>
  );
};

export { toggleId };
export default BankPicker;
