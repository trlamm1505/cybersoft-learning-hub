import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BarChart3, CheckCircle2, Compass, Flame, Loader2, Send, Sparkles, Target, TrendingUp, Trophy, Wrench } from 'lucide-react';
import learnerApi from '../axios/learnerApi';
import type { LearnerActivity, LearnerAiAdvice, LearnerProgress, LearnerStats, RecommendedExercise, RecommendationReasonKind } from '../types/learner';
import { tagLabel, isMetaTag } from '../common/tagLabels';
import { donutArcs, intensityLevel, lastDays, type DonutSlice } from '../common/progressCharts';

const KIND_META: Record<RecommendationReasonKind, { label: string; icon: React.ReactNode; badgeClass: string }> = {
  REMEDIATION: { label: 'Ôn lại', icon: <Wrench size={14} />, badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30' },
  PROGRESSION: { label: 'Đi tiếp', icon: <TrendingUp size={14} />, badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  EXPLORATION: { label: 'Khám phá', icon: <Compass size={14} />, badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30' },
};

const DIFFICULTY_LABEL: Record<string, string> = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' };

const RESULT_SLICES = (s: LearnerStats['submissions']): DonutSlice[] => [
  { key: 'ac', label: 'AC — Đúng hết', value: s.ac, color: '#10b981' },
  { key: 'wa', label: 'WA — Sai kết quả', value: s.wa, color: '#f43f5e' },
  { key: 'tle', label: 'TLE — Quá thời gian', value: s.tle, color: '#f59e0b' },
  { key: 're', label: 'RE — Lỗi khi chạy', value: s.re, color: '#a855f7' },
  { key: 'ce', label: 'CE — Lỗi cú pháp', value: s.ce, color: '#64748b' },
];

const HEAT = ['bg-[var(--border-color)]', 'bg-emerald-200 dark:bg-emerald-900', 'bg-emerald-300 dark:bg-emerald-700', 'bg-emerald-500', 'bg-emerald-700 dark:bg-emerald-400'];
const todayKey = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const Tile: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; note?: string; tone: string }> = ({ icon, label, value, note, tone }) => (
  <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
    <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>{icon}</div>
    <div className="text-2xl font-black text-[var(--text-main)]">{value}</div>
    <div className="text-xs font-semibold text-[var(--text-muted)]">{label}</div>
    {note && <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">{note}</div>}
  </div>
);

const RADIUS = 52;
const CIRC = 2 * Math.PI * RADIUS;

/** Tiến độ học tập: tổng quan, kết quả nộp bài (AC/WA/...), chuỗi ngày luyện tập, tỷ lệ hoàn thành theo chủ đề, gợi ý bài. */
export const LearnerProgressPage: React.FC = () => {
  const [progress, setProgress] = useState<LearnerProgress | null>(null);
  const [stats, setStats] = useState<LearnerStats | null>(null);
  const [activity, setActivity] = useState<LearnerActivity | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedExercise[]>([]);
  // Gemini phân tích lịch sử làm bài; tải riêng để trang không phải chờ model.
  const [advice, setAdvice] = useState<LearnerAiAdvice | null>(null);
  const [adviceState, setAdviceState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, r, s, a] = await Promise.all([
          learnerApi.getProgress(),
          learnerApi.getRecommendations(),
          learnerApi.getStats(),
          learnerApi.getActivity(30).catch(() => null),
        ]);
        if (cancelled) return;
        setProgress(p);
        setRecommendations(r.recommendations);
        setStats(s);
        setActivity(a);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError('Không tải được tiến độ học tập. Vui lòng thử lại sau.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    learnerApi
      .getAiAdvice()
      .then((a) => {
        if (cancelled) return;
        setAdvice(a);
        setAdviceState('ok');
      })
      .catch(() => !cancelled && setAdviceState('error'));
    return () => {
      cancelled = true;
    };
  }, []);

  const arcs = useMemo(() => (stats ? donutArcs(RESULT_SLICES(stats.submissions), CIRC) : []), [stats]);
  const strip = useMemo(() => lastDays(activity?.days ?? [], activity?.to ?? todayKey(), 14), [activity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--text-muted)]">
        <Loader2 className="mr-2 animate-spin" size={20} /> Đang tải tiến độ học tập...
      </div>
    );
  }
  if (error || !stats) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-500">
        <AlertTriangle size={18} /> {error ?? 'Không tải được tiến độ học tập.'}
      </div>
    );
  }

  const total = stats.submissions.total;
  const completionPct = stats.totalExercises ? Math.round((stats.solvedExercises / stats.totalExercises) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-main)]">
          <BarChart3 size={24} /> Tiến độ học tập của tôi
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Tổng hợp từ {total} lượt nộp bài đã chấm của bạn.</p>
      </div>

      <section aria-label="Tổng quan" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile tone="bg-emerald-500/15 text-emerald-600" icon={<CheckCircle2 size={18} />} label="Bài đã giải" value={`${stats.solvedExercises}/${stats.totalExercises}`} note={`${completionPct}% bài của khối`} />
        <Tile tone="bg-sky-500/15 text-sky-600" icon={<Send size={18} />} label="Lượt nộp bài" value={total} />
        <Tile tone="bg-violet-500/15 text-violet-600" icon={<Trophy size={18} />} label="Tỷ lệ đúng (AC)" value={`${stats.acRate}%`} note={`${stats.submissions.ac} lượt AC`} />
        <Tile tone="bg-orange-500/15 text-orange-600" icon={<Flame size={18} />} label="Chuỗi ngày luyện tập" value={`${activity?.currentStreak ?? 0} ngày`} note={`Dài nhất: ${activity?.bestStreak ?? 0} ngày`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Kết quả nộp bài" className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-main)]">Kết quả các lượt nộp bài</h2>
          {arcs.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Bạn chưa có lượt nộp nào được chấm. Hãy làm vài bài trong Bài tập / Playground để thấy biểu đồ.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-6">
              <svg viewBox="0 0 140 140" width="150" height="150" role="img" aria-label={`Biểu đồ kết quả nộp bài: ${stats.submissions.ac} AC, ${stats.submissions.wa} WA`}>
                <g transform="rotate(-90 70 70)">
                  <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="var(--border-color)" strokeWidth="16" />
                  {arcs.map((a) => (
                    <circle
                      key={a.key}
                      cx="70"
                      cy="70"
                      r={RADIUS}
                      fill="none"
                      stroke={a.color}
                      strokeWidth="16"
                      strokeDasharray={`${a.length} ${CIRC - a.length}`}
                      strokeDashoffset={-a.offset}
                    />
                  ))}
                </g>
                <text x="70" y="68" textAnchor="middle" className="fill-[var(--text-main)]" style={{ fontSize: 24, fontWeight: 800 }}>{stats.acRate}%</text>
                <text x="70" y="86" textAnchor="middle" className="fill-[var(--text-muted)]" style={{ fontSize: 10 }}>đúng (AC)</text>
              </svg>
              <ul className="space-y-1.5 text-sm">
                {RESULT_SLICES(stats.submissions).map((s) => (
                  <li key={s.key} className="flex items-center gap-2 text-[var(--text-main)]">
                    <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: s.color }} aria-hidden="true" />
                    <span className="min-w-[10.5rem]">{s.label}</span>
                    <span className="font-bold">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section aria-label="Chuỗi ngày luyện tập" className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-main)]">Chuỗi ngày luyện tập</h2>
          <div className="mb-4 flex items-end gap-6">
            <div>
              <div className="flex items-center gap-1 text-3xl font-black text-orange-500"><Flame size={26} /> {activity?.currentStreak ?? 0}</div>
              <div className="text-xs text-[var(--text-muted)]">ngày liên tiếp hiện tại</div>
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--text-main)]">{activity?.bestStreak ?? 0}</div>
              <div className="text-xs text-[var(--text-muted)]">chuỗi dài nhất</div>
            </div>
          </div>
          <div className="flex gap-1.5" role="img" aria-label="14 ngày gần nhất, ô đậm là ngày có nộp bài">
            {strip.map((d) => (
              <div key={d.date} title={`${d.date}: ${d.count} lượt nộp`} className={`h-8 flex-1 rounded-md ${HEAT[intensityLevel(d.count)]}`} />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-[var(--text-muted)]"><span>14 ngày trước</span><span>Hôm nay</span></div>
          <p className="mt-3 text-xs text-[var(--text-muted)]">Luyện ít nhất một bài mỗi ngày để giữ chuỗi. Bỏ lỡ một ngày là chuỗi bắt đầu lại.</p>
        </section>
      </div>

      <section aria-label="Tiến độ theo chủ đề">
        <h2 className="mb-3 text-lg font-semibold text-[var(--text-main)]">Tỷ lệ hoàn thành theo chủ đề</h2>
        {stats.topics.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Chưa có chủ đề nào để thống kê.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.topics.map((t) => (
              <div key={t.tag} className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3">
                <svg viewBox="0 0 44 44" width="52" height="52" role="img" aria-label={`${t.label ?? tagLabel(t.tag)}: ${t.percent}%`}>
                  <g transform="rotate(-90 22 22)">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border-color)" strokeWidth="6" />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      fill="none"
                      stroke={t.percent >= 80 ? '#10b981' : t.percent >= 40 ? '#f59e0b' : '#f43f5e'}
                      strokeWidth="6"
                      strokeLinecap={t.percent > 0 ? 'round' : 'butt'}
                      strokeDasharray={`${(t.percent / 100) * 2 * Math.PI * 18} ${2 * Math.PI * 18}`}
                    />
                  </g>
                  <text x="22" y="26" textAnchor="middle" className="fill-[var(--text-main)]" style={{ fontSize: 11, fontWeight: 800 }}>{t.percent}%</text>
                </svg>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-[var(--text-main)]">{t.label ?? tagLabel(t.tag)}</div>
                  <div className="text-xs text-[var(--text-muted)]">{t.solved}/{t.total} bài đã giải</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Bài tập gợi ý">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--text-main)]">
          <Target size={18} /> Bài tập gợi ý cho bạn
        </h2>
        {adviceState === 'loading' ? (
          <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Loader2 size={14} className="animate-spin" /> AI đang xem lại lịch sử làm bài của bạn...
          </p>
        ) : adviceState === 'ok' && advice && (advice.weakness || advice.next.length > 0) ? (
          <div className="space-y-3" data-testid="ai-advice">
            {advice.weakness && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-main)]">
                  <Wrench size={15} className="text-rose-600" /> Chủ đề bạn hay sai nhất: {advice.weakness.topic}
                </div>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{advice.weakness.advice}</p>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {advice.next.map((n) => (
                <div key={n.slug} className="flex flex-col gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
                  <span className="font-semibold text-[var(--text-main)]">{n.title}</span>
                  <p className="text-sm text-[var(--text-muted)]">{n.reason}</p>
                  <Link
                    to={`/playground?slug=${encodeURIComponent(n.slug)}`}
                    className="mt-auto inline-flex items-center gap-1 self-start rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white no-underline hover:bg-indigo-500"
                  >
                    Làm bài này
                  </Link>
                </div>
              ))}
            </div>
            <p className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <Sparkles size={12} />
              {advice.source === 'gemini' ? 'Gợi ý do AI Gemini phân tích lịch sử làm bài của bạn.' : 'Gợi ý tự động từ lịch sử làm bài của bạn.'}
            </p>
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Chưa có gợi ý nào — có thể ngân hàng bài tập chưa có bài phù hợp lúc này.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec) => {
              const meta = KIND_META[rec.kind];
              return (
                <div key={rec.exercise.id} className="flex flex-col gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
                  <span className={`inline-flex items-center gap-1 self-start rounded-full border px-2 py-0.5 text-xs font-semibold ${meta.badgeClass}`}>
                    {meta.icon} {meta.label}
                  </span>
                  <span className="font-semibold text-[var(--text-main)]">{rec.exercise.title}</span>
                  <span className="text-xs text-[var(--text-muted)]">
                    Chủ đề: {isMetaTag(rec.tag) ? 'Chung' : tagLabel(rec.tag)} · Độ khó: {DIFFICULTY_LABEL[rec.exercise.difficulty] ?? rec.exercise.difficulty}
                  </span>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{rec.reason}</p>
                </div>
              );
            })}
          </div>
        )}
        {progress && progress.tagMastery.length > 0 && (
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Gợi ý dựa trên mức thành thạo các chủ đề: {progress.tagMastery.slice(0, 5).map((m) => `${tagLabel(m.tag)} ${m.masteryPercent}%`).join(' · ')}
          </p>
        )}
      </section>
    </div>
  );
};

export default LearnerProgressPage;
