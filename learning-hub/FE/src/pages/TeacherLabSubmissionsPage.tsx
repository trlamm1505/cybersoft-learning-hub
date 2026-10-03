import React, { useEffect, useState } from 'react';
import { AlertTriangle, ListChecks, Loader2 } from 'lucide-react';
import teacherLabSubmissionsApi from '../axios/teacherLabSubmissionsApi';
import type { AiLabSubmissionRow, DaLabSubmissionRow } from '../axios/teacherLabSubmissionsApi';

type Tab = 'SQL' | 'INSIGHT' | 'AI';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'SQL', label: 'DA Lab · SQL' },
  { key: 'INSIGHT', label: 'DA Lab · Insight' },
  { key: 'AI', label: 'AI Lab' },
];

const cellCls = 'px-3 py-2 text-xs text-[var(--text-main)] align-top';
const headCls = 'px-3 py-2 text-left text-xs font-semibold text-[var(--text-main)] whitespace-nowrap';

const studentName = (s: { fullName?: string; email?: string; id: string }) => s.fullName || s.email || s.id;
const formatTime = (iso: string) => new Date(iso).toLocaleString('vi-VN');

const DaTable: React.FC<{ rows: DaLabSubmissionRow[] }> = ({ rows }) => (
  <table className="min-w-full">
    <thead className="bg-[var(--bg-main)]">
      <tr>
        {['Học viên', 'Bài', 'Điểm gần nhất', 'Cao nhất', 'Số lần', 'Trạng thái', 'Bài làm', 'Cập nhật'].map((h) => (
          <th key={h} className={headCls}>
            {h}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <tr key={r.id} className="border-t border-[var(--border-color)]">
          <td className={cellCls}>{studentName(r.student)}</td>
          <td className={cellCls}>{r.exercise.title ?? r.exercise.slug}</td>
          <td className={`${cellCls} font-mono`}>
            {r.score}/{r.maxScore}
          </td>
          <td className={`${cellCls} font-mono`}>{r.bestScore}</td>
          <td className={`${cellCls} font-mono`}>{r.attemptCount}</td>
          <td className={cellCls}>{r.status === 'GRADED' ? 'Đã chấm' : 'Chờ chấm'}</td>
          <td className={`${cellCls} max-w-md`}>
            <pre className="whitespace-pre-wrap font-mono text-[11px] max-h-24 overflow-auto">{r.content}</pre>
          </td>
          <td className={`${cellCls} whitespace-nowrap`}>{formatTime(r.updatedAt)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const AiTable: React.FC<{ rows: AiLabSubmissionRow[] }> = ({ rows }) => (
  <table className="min-w-full">
    <thead className="bg-[var(--bg-main)]">
      <tr>
        {['Học viên', 'Bài', 'Điểm gần nhất', 'Cao nhất', 'Chất lượng', 'Chi phí', 'Độ trễ', 'Model', 'Số lần', 'Prompt', 'Cập nhật'].map(
          (h) => (
            <th key={h} className={headCls}>
              {h}
            </th>
          ),
        )}
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <tr key={r.id} className="border-t border-[var(--border-color)]">
          <td className={cellCls}>{studentName(r.student)}</td>
          <td className={`${cellCls} font-mono`}>{r.exerciseSlug}</td>
          <td className={`${cellCls} font-mono`}>
            {r.score}/{r.maxScore} {r.status === 'PASSED' ? '✓' : ''}
          </td>
          <td className={`${cellCls} font-mono`}>{r.best?.score ?? r.score}</td>
          <td className={`${cellCls} font-mono`}>{r.qualityScore}</td>
          <td className={`${cellCls} font-mono`}>${r.cost.toFixed(6)}</td>
          <td className={`${cellCls} font-mono`}>{r.latency} ms</td>
          <td className={`${cellCls} font-mono`}>{r.model}</td>
          <td className={`${cellCls} font-mono`}>{r.totalAttempts}</td>
          <td className={`${cellCls} max-w-md`}>
            <pre className="whitespace-pre-wrap font-mono text-[11px] max-h-24 overflow-auto">{r.prompt}</pre>
          </td>
          <td className={`${cellCls} whitespace-nowrap`}>{formatTime(r.updatedAt)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

/** Giảng viên/quản trị viên xem bài nộp DA Lab (SQL, Insight) và AI Lab của học viên. */
export const TeacherLabSubmissionsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('SQL');
  const [daRows, setDaRows] = useState<DaLabSubmissionRow[]>([]);
  const [aiRows, setAiRows] = useState<AiLabSubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const request =
      tab === 'AI'
        ? teacherLabSubmissionsApi.getAiSubmissions().then((rows) => !cancelled && setAiRows(rows))
        : teacherLabSubmissionsApi.getDaSubmissions(tab).then((rows) => !cancelled && setDaRows(rows));
    request
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message || 'Không tải được danh sách bài nộp.');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const empty = tab === 'AI' ? aiRows.length === 0 : daRows.length === 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
        <ListChecks size={24} /> Bài nộp Lab của học viên
      </h1>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border cursor-pointer ${
              tab === t.key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center text-sm text-[var(--text-muted)] py-8">
          <Loader2 className="animate-spin mr-2" size={16} /> Đang tải...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      ) : empty ? (
        <p className="text-sm text-[var(--text-muted)]">Chưa có bài nộp nào.</p>
      ) : (
        <div className="overflow-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          {tab === 'AI' ? <AiTable rows={aiRows} /> : <DaTable rows={daRows} />}
        </div>
      )}
    </div>
  );
};

export default TeacherLabSubmissionsPage;
