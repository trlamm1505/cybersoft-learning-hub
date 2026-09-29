import React, { useEffect, useState } from 'react';
import {
  Loader2,
  AlertTriangle,
  TrendingUp,
  Target,
  Compass,
  Wrench,
  BarChart3,
} from 'lucide-react';
import learnerApi from '../axios/learnerApi';
import type {
  LearnerProgress,
  RecommendedExercise,
  RecommendationReasonKind,
} from '../types/learner';

const KIND_META: Record<
  RecommendationReasonKind,
  { label: string; icon: React.ReactNode; badgeClass: string }
> = {
  REMEDIATION: {
    label: 'Ôn lại',
    icon: <Wrench size={16} />,
    badgeClass: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
  },
  PROGRESSION: {
    label: 'Đi tiếp',
    icon: <TrendingUp size={16} />,
    badgeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  },
  EXPLORATION: {
    label: 'Khám phá',
    icon: <Compass size={16} />,
    badgeClass: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
  },
};

function masteryBarColor(percent: number): string {
  if (percent >= 80) return 'bg-emerald-500';
  if (percent >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

export const LearnerProgressPage: React.FC = () => {
  const [progress, setProgress] = useState<LearnerProgress | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [progressRes, recommendationsRes] = await Promise.all([
          learnerApi.getProgress(),
          learnerApi.getRecommendations(),
        ]);
        if (cancelled) return;
        setProgress(progressRes);
        setRecommendations(recommendationsRes.recommendations);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError('Không tải được tiến độ học tập. Vui lòng thử lại sau.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--text-muted)]">
        <Loader2 className="animate-spin mr-2" size={20} />
        Đang tải tiến độ học tập...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-6 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500">
        <AlertTriangle size={18} />
        {error}
      </div>
    );
  }

  const tagMastery = progress?.tagMastery ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <BarChart3 size={24} />
          Tiến độ học tập của tôi
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Dựa trên {progress?.totalAttempts ?? 0} lượt nộp bài đã chấm.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-[var(--text-main)] mb-3">
          Mastery theo chủ đề (tag)
        </h2>
        {tagMastery.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Bạn chưa có lượt nộp bài nào — hãy làm vài bài tập để bắt đầu theo dõi tiến độ.
          </p>
        ) : (
          <div className="space-y-3">
            {tagMastery.map((m) => (
              <div key={m.tag} className="rounded-lg border border-[var(--border-color)] p-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-[var(--text-main)]">{m.tag}</span>
                  <span className="text-[var(--text-muted)]">
                    {m.masteryPercent}% ({m.acCount}/{m.attemptCount} lần AC)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--border-color)] overflow-hidden">
                  <div
                    className={`h-full ${masteryBarColor(m.masteryPercent)}`}
                    style={{ width: `${Math.min(100, Math.max(0, m.masteryPercent))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--text-main)] mb-3 flex items-center gap-2">
          <Target size={18} />
          Bài tập gợi ý cho bạn
        </h2>
        {recommendations.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Chưa có gợi ý nào — có thể ngân hàng bài tập chưa có bài phù hợp lúc này.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec) => {
              const meta = KIND_META[rec.kind];
              return (
                <div
                  key={rec.exercise.id}
                  className="rounded-lg border border-[var(--border-color)] p-4 flex flex-col gap-2"
                >
                  <span
                    className={`inline-flex items-center gap-1 self-start text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.badgeClass}`}
                  >
                    {meta.icon}
                    {meta.label}
                  </span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {rec.exercise.title}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    Tag: {rec.tag} · Độ khó: {rec.exercise.difficulty}
                  </span>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{rec.reason}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default LearnerProgressPage;
