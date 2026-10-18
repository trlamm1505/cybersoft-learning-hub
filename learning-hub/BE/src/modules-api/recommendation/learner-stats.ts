import { topicGroupOf } from './topic-groups';

/** Thống kê tiến độ cho trang "Tiến độ học tập": lượt nộp theo kết quả và tỷ lệ hoàn thành theo chủ đề. Hàm thuần. */
export interface StatsSubmission {
  exerciseId: string;
  status: string;
}

export interface StatsExercise {
  id: string;
  tags: string[];
  /** Dùng để suy ra nhóm chủ đề cho bài chưa gắn tag. */
  slug?: string;
  title?: string;
}

export interface TopicProgress {
  /** Khóa nhóm chủ đề (vd 'loops'), không phải tag gốc. */
  tag: string;
  /** Tên nhóm tiếng Việt để hiển thị. */
  label: string;
  solved: number;
  total: number;
  percent: number;
}

export interface LearnerStats {
  submissions: { total: number; ac: number; wa: number; tle: number; re: number; ce: number };
  /** Tỷ lệ AC trên các lượt đã chấm (AC/WA/TLE/RE/CE), làm tròn %. */
  acRate: number;
  solvedExercises: number;
  totalExercises: number;
  topics: TopicProgress[];
}

const MAX_TOPICS = 8;

export function computeLearnerStats(
  submissions: StatsSubmission[],
  exercises: StatsExercise[],
  /** Tập bài được coi là "đã giải" (vd hoàn thành ở Playground). Bỏ trống = mọi bài có lượt AC. Không ảnh hưởng số lượt nộp theo kết quả. */
  solvedOverride?: ReadonlySet<string>,
): LearnerStats {
  const count = (s: string) => submissions.filter((x) => x.status === s).length;
  const ac = count('AC');
  const wa = count('WA');
  const tle = count('TLE');
  const re = count('RE');
  const ce = count('CE');
  const graded = ac + wa + tle + re + ce;

  const solvedIds = solvedOverride ?? new Set(submissions.filter((s) => s.status === 'AC').map((s) => s.exerciseId));
  // Mỗi bài thuộc đúng một nhóm chủ đề (gom từ tag, hoặc suy ra từ slug/tiêu đề khi bài chưa có tag).
  const byTopic = new Map<string, { label: string; solved: number; total: number }>();
  for (const ex of exercises) {
    const g = topicGroupOf(ex);
    const t = byTopic.get(g.key) ?? { label: g.label, solved: 0, total: 0 };
    t.total += 1;
    if (solvedIds.has(ex.id)) t.solved += 1;
    byTopic.set(g.key, t);
  }
  const topics = [...byTopic.entries()]
    .map(([tag, t]) => ({ tag, label: t.label, solved: t.solved, total: t.total, percent: Math.round((t.solved / t.total) * 100) }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label))
    .slice(0, MAX_TOPICS);

  return {
    submissions: { total: submissions.length, ac, wa, tle, re, ce },
    acRate: graded ? Math.round((ac / graded) * 100) : 0,
    solvedExercises: exercises.filter((e) => solvedIds.has(e.id)).length,
    totalExercises: exercises.length,
    topics,
  };
}
