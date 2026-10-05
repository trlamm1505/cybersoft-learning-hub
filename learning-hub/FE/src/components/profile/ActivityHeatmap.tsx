import React, { useEffect, useMemo, useRef } from 'react';
import {
  buildHeatmap,
  formatDateVi,
  monthsShown,
  sampleActivity,
  toCountMap,
  type HeatLevel,
} from './heatmapModel';

interface ActivityHeatmapProps {
  /** Các ngày có hoạt động (từ API); rỗng thì hiển thị dữ liệu mẫu và ghi rõ. */
  days: Array<{ date: string; count: number }>;
  loading?: boolean;
  error?: string | null;
  /** Ngày kết thúc của biểu đồ (mặc định hôm nay); chỉ để kiểm thử/hiển thị cố định. */
  end?: Date;
}

/** Màu theo mức: xám (không hoạt động) rồi xanh lá đậm dần đến xanh cyan. */
const LEVEL_CLASS: Record<HeatLevel, string> = {
  0: 'bg-slate-200 dark:bg-slate-700/50',
  1: 'bg-emerald-200 dark:bg-emerald-900',
  2: 'bg-emerald-400 dark:bg-emerald-700',
  3: 'bg-emerald-500 dark:bg-emerald-500',
  4: 'bg-cyan-500 dark:bg-cyan-400',
};

const WEEKDAY_LABELS: Array<string | null> = ['T2', null, 'T4', null, 'T6', null, null];

const cellTitle = (date: string, count: number) =>
  count > 0 ? `${count} lượt nộp bài · ${formatDateVi(date)}` : `Không có hoạt động · ${formatDateVi(date)}`;

/** Biểu đồ hoạt động kiểu GitHub: mỗi ô là một ngày, màu đậm theo số lượt nộp bài. */
export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ days, loading = false, error = null, end }) => {
  const today = useMemo(() => end ?? new Date(), [end]);
  const isSample = !loading && !error && days.every((d) => d.count <= 0);
  const counts = useMemo(() => (isSample ? sampleActivity(today) : toCountMap(days)), [isSample, days, today]);
  const model = useMemo(() => buildHeatmap(counts, today), [counts, today]);

  // Màn hình hẹp phải cuộn ngang: luôn hiện sẵn các tuần gần nhất (bên phải) thay vì tuần cũ nhất.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [model, loading]);

  return (
    <section aria-label="Biểu đồ hoạt động" className="min-w-0">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--text-main)]">Hoạt động học tập</h2>
        {isSample && (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-400">
            Dữ liệu mẫu
          </span>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : (
        <div ref={scrollRef} className={`overflow-x-auto pb-1 ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
          <div className="min-w-[520px]">
            {/* Nhãn tháng: cùng số cột với lưới để thẳng hàng với từng tuần */}
            <div className="mb-1 grid pl-[26px] text-[10px] text-[var(--text-muted)]" style={{ gridTemplateColumns: `repeat(${model.weeks.length}, minmax(0, 1fr))` }}>
              {model.monthLabels.map((m) => (
                <span
                  key={`${m.col}-${m.label}`}
                  // Nhãn sát mép phải căn về bên phải để chữ không tràn ra ngoài cột cuối (gây cuộn ngang thừa).
                  style={{ gridColumnStart: m.col + 1, justifySelf: m.col >= model.weeks.length - 3 ? 'end' : 'start' }}
                  className="whitespace-nowrap"
                >
                  {m.label}
                </span>
              ))}
            </div>

            <div className="flex gap-1.5">
              <div className="sticky left-0 z-10 grid w-5 shrink-0 gap-[3px] bg-[var(--bg-main)] text-[10px] text-[var(--text-muted)]" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }} aria-hidden="true">
                {WEEKDAY_LABELS.map((l, i) => (
                  <span key={i} className="flex items-center leading-none">
                    {l}
                  </span>
                ))}
              </div>
              <div
                className="grid flex-1 grid-flow-col gap-[3px]"
                style={{
                  gridTemplateColumns: `repeat(${model.weeks.length}, minmax(0, 1fr))`,
                  gridTemplateRows: 'repeat(7, auto)',
                }}
                role="img"
                aria-label={`${model.total} lượt nộp bài trong ${model.activeDays} ngày`}
              >
                {model.weeks.flatMap((week) =>
                  week.map((cell) =>
                    cell.future ? (
                      <span key={cell.date} className="aspect-square" />
                    ) : (
                      <span
                        key={cell.date}
                        title={cellTitle(cell.date, cell.count)}
                        className={`aspect-square rounded-[2px] ${LEVEL_CLASS[cell.level]}`}
                      />
                    ),
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
        <span>
          <strong className="text-[var(--text-main)]">{loading ? '…' : model.total}</strong> lượt nộp bài trong {monthsShown()} tháng qua
          {!loading && model.activeDays > 0 ? ` · ${model.activeDays} ngày hoạt động` : ''}
        </span>
        <span className="flex items-center gap-1" aria-label="Chú thích mức độ">
          Ít
          {([0, 1, 2, 3, 4] as HeatLevel[]).map((l) => (
            <span key={l} className={`h-2.5 w-2.5 rounded-[2px] ${LEVEL_CLASS[l]}`} />
          ))}
          Nhiều
        </span>
      </div>
    </section>
  );
};

export default ActivityHeatmap;
