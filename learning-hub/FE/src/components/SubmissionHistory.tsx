import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, History, XCircle } from 'lucide-react';

export interface HistoryItem {
  id: string;
  submittedAt: string;
  /** Nhãn kết quả ngắn, vd "Đạt", "Chưa đạt", "Chờ giảng viên chấm". */
  resultLabel: string;
  passed?: boolean;
  scoreText?: string;
  /** Nội dung đã nộp (câu SQL / prompt / câu trả lời); hiện khi bấm vào dòng. */
  content: string;
  /** Nhận xét/kết quả đã lưu của lần nộp đó (không gọi AI để tạo mới). */
  feedback?: string;
}

export const formatSubmittedAt = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const vn = new Date(d.getTime() + 7 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(vn.getUTCDate())}/${p(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()} ${p(vn.getUTCHours())}:${p(vn.getUTCMinutes())}`;
};

/**
 * Lịch sử làm bài: danh sách các lần nộp (mới nhất trước); bấm vào một dòng để xem lại câu trả lời cũ
 * và nhận xét đã lưu. `onReuse` (tùy chọn) nạp lại nội dung cũ vào ô soạn thảo.
 */
export const SubmissionHistory: React.FC<{
  items: HistoryItem[];
  title?: string;
  onReuse?: (content: string) => void;
  reuseLabel?: string;
}> = ({ items, title = 'Lịch sử làm bài', onReuse, reuseLabel = 'Nạp lại vào ô soạn thảo' }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <section aria-label={title} className="space-y-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4" data-testid="submission-history">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
        <History size={15} /> {title} {items.length > 0 && <span className="text-xs font-normal text-[var(--text-muted)]">({items.length} lần nộp)</span>}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">Bạn chưa nộp bài nào. Các lần nộp sẽ được lưu lại ở đây để xem lại.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => {
            const open = openId === it.id;
            return (
              <li key={it.id} className="rounded-lg border border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : it.id)}
                  aria-expanded={open}
                  className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent px-3 py-2 text-left text-xs text-[var(--text-main)]"
                >
                  {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="font-mono text-[var(--text-muted)]">{formatSubmittedAt(it.submittedAt)}</span>
                  {it.passed === true && <CheckCircle2 size={14} className="text-emerald-500" />}
                  {it.passed === false && <XCircle size={14} className="text-rose-500" />}
                  <span className="font-semibold">{it.resultLabel}</span>
                  {it.scoreText && <span className="ml-auto font-mono">{it.scoreText}</span>}
                </button>
                {open && (
                  <div className="space-y-2 border-t border-[var(--border-color)] px-3 py-2">
                    <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded bg-[var(--bg-main)] p-2 font-mono text-xs text-[var(--text-main)]">{it.content}</pre>
                    {it.feedback && <p className="text-xs text-[var(--text-muted)]">{it.feedback}</p>}
                    {onReuse && (
                      <button type="button" onClick={() => onReuse(it.content)} className="cursor-pointer rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-1 text-xs font-semibold text-[var(--text-main)]">
                        {reuseLabel}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default SubmissionHistory;
