import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Trophy } from 'lucide-react';
import axiosClient from '../../common/configAxios';

export interface ContestHistoryItem {
  contestId: string;
  title: string;
  joinedAt: string;
  score: number;
  maxScore: number;
  durationMinutes: number | null;
  rank: number | null;
  totalParticipants: number;
  provisional: boolean;
  /** Giảng viên không công nhận kết quả: vẫn thấy điểm của mình nhưng không có hạng chính thức. */
  disqualified?: boolean;
  disqualifiedReason?: string | null;
}

export const contestHistoryApi = {
  /** GET /api/student/contest-history — lịch sử cuộc thi của chính học viên đang đăng nhập. */
  get: async (): Promise<ContestHistoryItem[]> => axiosClient.get('/student/contest-history'),
};

export const EMPTY_CONTEST_HISTORY_TEXT = 'Bạn chưa tham gia cuộc thi nào. Hãy thử sức tại mục Cuộc thi nhé!';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(vn.getUTCDate())}/${p(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()}`;
};

export const formatDuration = (minutes: number | null): string => {
  if (minutes === null) return '—';
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
};

export const formatRank = (rank: number | null, total: number, provisional: boolean): string =>
  rank === null ? '—' : `Hạng ${rank} / ${total} thí sinh${provisional ? ' (tạm thời)' : ''}`;

const head = 'px-3 py-2 text-left text-xs font-semibold whitespace-nowrap text-[var(--text-main)]';
const cell = 'px-3 py-2 text-sm text-[var(--text-main)] align-top';

/** Bảng + trạng thái rỗng, tách riêng để dễ kiểm thử. */
export const ContestHistoryTable: React.FC<{ items: ContestHistoryItem[] }> = ({ items }) =>
  items.length === 0 ? (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 text-sm text-[var(--text-muted)]">
      <p>{EMPTY_CONTEST_HISTORY_TEXT}</p>
      <Link
        to="/contests"
        className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white no-underline hover:bg-indigo-500"
      >
        Đến mục Cuộc thi
      </Link>
    </div>
  ) : (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
      <table className="min-w-full">
        <thead className="bg-[var(--bg-main)]">
          <tr>
            {['Cuộc thi', 'Ngày tham gia', 'Điểm số', 'Thời gian làm bài', 'Thứ hạng chung cuộc'].map((h) => (
              <th key={h} className={head}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.contestId} className="border-t border-[var(--border-color)]">
              <td className={`${cell} font-semibold`}>{c.title}</td>
              <td className={`${cell} whitespace-nowrap`}>{formatDate(c.joinedAt)}</td>
              <td className={`${cell} whitespace-nowrap font-mono`}>
                {c.score}/{c.maxScore}
              </td>
              <td className={`${cell} whitespace-nowrap`}>{formatDuration(c.durationMinutes)}</td>
              <td className={`${cell} whitespace-nowrap font-semibold`}>
                {c.disqualified ? (
                  <span className="inline-flex flex-col items-start gap-0.5" title={c.disqualifiedReason ?? undefined}>
                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300">Không công nhận kết quả</span>
                    <span className="text-[11px] font-normal text-[var(--text-muted)]">Không có trong bảng xếp hạng chính thức</span>
                  </span>
                ) : (
                  formatRank(c.rank, c.totalParticipants, c.provisional)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

/** "Lịch sử Cuộc thi đã tham gia" dưới biểu đồ hoạt động ở trang Hồ sơ. */
export const ContestHistorySection: React.FC = () => {
  const [items, setItems] = useState<ContestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    contestHistoryApi
      .get()
      .then((r) => !cancelled && setItems(r))
      .catch(() => !cancelled && setError('Không tải được lịch sử cuộc thi.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-label="Lịch sử cuộc thi" className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--text-main)]">
        <Trophy size={18} /> Lịch sử Cuộc thi đã tham gia
      </h2>
      {loading ? (
        <p className="flex items-center text-sm text-[var(--text-muted)]">
          <Loader2 size={14} className="mr-2 animate-spin" /> Đang tải...
        </p>
      ) : error ? (
        <p className="text-sm text-rose-500">{error}</p>
      ) : (
        <ContestHistoryTable items={items} />
      )}
    </section>
  );
};

export default ContestHistorySection;
