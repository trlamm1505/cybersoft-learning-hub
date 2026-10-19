import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import assessmentApi from '../axios/assessmentApi';
import { hairline } from './adminStyles';
import type { CatalogStudent } from '../types/teacherAnalytics';
import type { KidProgressRow } from '../types/assessment';
import { kidHonorRoll, sortKidsForTeacher } from '../pages/teacherClassesModel';

const th = 'px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] whitespace-nowrap';
const td = 'px-3 py-2 text-sm text-[var(--text-main)]';

const MEDALS = [
  { icon: '🥇', name: 'Huy hiệu Vàng', cls: 'bg-amber-100 text-amber-950 ring-1 ring-amber-300 dark:bg-amber-950 dark:text-amber-50 dark:ring-amber-700' },
  { icon: '🥈', name: 'Huy hiệu Bạc', cls: 'bg-slate-100 text-slate-900 ring-1 ring-slate-300 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700' },
  { icon: '🥉', name: 'Huy hiệu Đồng', cls: 'bg-orange-50 text-orange-950 ring-1 ring-orange-200 dark:bg-orange-950 dark:text-orange-50 dark:ring-orange-800' },
];

export const STUCK_BADGE_TEXT = '⚠️ Bé kẹt ải > 3 ngày, cần cô hỗ trợ';

/**
 * Lớp khối 3-5: màn hình duy nhất "Hành trình vượt ải & Tiến độ của bé". Dữ liệu sao/ải/cờ kẹt lấy từ kid_progress
 * (GET /teacher/classes/:classId/kid-progress); bé trong lớp chưa chơi ải nào hiện 0 sao, Ải 1.
 */
export const KidJourneyPanel: React.FC<{ classId: string; students: CatalogStudent[] }> = ({ classId, students }) => {
  const [rows, setRows] = useState<KidProgressRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    assessmentApi
      .getKidProgress(classId)
      .then((r) => !cancelled && setRows(r))
      .catch(() => {
        if (cancelled) return;
        setError('Không tải được tiến độ ải của các bé.');
        setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const merged = useMemo(() => {
    const byId = new Map((rows ?? []).map((r) => [r.studentId, r]));
    const all: KidProgressRow[] = students.map(
      (s) =>
        byId.get(s.id) ?? { studentId: s.id, fullName: s.name, currentLevel: 1, starsEarned: 0, levelsDone: 0, levelsTotal: 0, lastActiveAt: null, stuckAlert: { active: false, level: null, since: null } },
    );
    return sortKidsForTeacher(all.map((r) => ({ ...r, fullName: r.fullName || students.find((s) => s.id === r.studentId)?.name || '' })));
  }, [rows, students]);
  const top = kidHonorRoll(merged);

  if (rows === null) {
    return (
      <div className="flex items-center py-6 text-sm text-[var(--text-muted)]">
        <Loader2 className="mr-2 animate-spin" size={16} /> Đang tải hành trình của các bé...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-[var(--text-main)]">Hành trình vượt ải &amp; Tiến độ của bé</h2>
      {error && <p className="text-sm text-rose-500">{error}</p>}

      <section aria-label="Bảng vinh danh" className={`rounded-lg border p-4 ${hairline}`}>
        <h3 className="mb-3 text-sm font-medium text-[var(--text-main)]">Bảng Vinh Danh Top 3</h3>
        {top.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Chưa có bé nào nhận được sao.</p>
        ) : (
          <ol className="grid gap-3 sm:grid-cols-3">
            {top.map((k, i) => (
              <li key={k.studentId} className={`flex items-center gap-3 rounded-lg px-4 py-3 ${MEDALS[i].cls}`}>
                <span className="text-2xl" aria-hidden>
                  {MEDALS[i].icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{k.fullName}</span>
                  <span className="text-xs tabular-nums">
                    {MEDALS[i].name} · ⭐ {k.starsEarned} sao
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-label="Bảng theo dõi vượt ải">
        <h3 className="mb-2 text-sm font-medium text-[var(--text-main)]">Bảng Theo Dõi Vượt Ải</h3>
        <div className={`overflow-x-auto rounded-lg border ${hairline}`}>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className={th}>Bé</th>
                <th className={th}>Sao ⭐</th>
                <th className={th}>Ải hiện tại</th>
                <th className={th}>Cần hỗ trợ</th>
              </tr>
            </thead>
            <tbody>
              {merged.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`${td} text-[var(--text-muted)]`}>
                    Lớp chưa có bé nào.
                  </td>
                </tr>
              ) : (
                merged.map((k) => (
                  <tr key={k.studentId} className={`border-t ${hairline} ${k.stuckAlert.active ? 'bg-orange-50/80 dark:bg-orange-950/30' : ''}`}>
                    <td className={`${td} font-medium`}>{k.fullName}</td>
                    <td className={`${td} tabular-nums`}>
                      <span className="inline-flex items-center gap-1">
                        <Star size={14} className="fill-amber-400 text-amber-400" aria-hidden /> {k.starsEarned}
                      </span>
                      {k.levelsTotal > 0 && <span className="ml-2 text-xs text-[var(--text-muted)]">({k.levelsDone}/{k.levelsTotal} màn)</span>}
                    </td>
                    <td className={`${td} tabular-nums`}>Ải {k.currentLevel}</td>
                    <td className={td}>
                      {k.stuckAlert.active ? (
                        <span className="inline-flex items-center rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white" title={`Kẹt ở Ải ${k.stuckAlert.level}`}>
                          {STUCK_BADGE_TEXT}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default KidJourneyPanel;
