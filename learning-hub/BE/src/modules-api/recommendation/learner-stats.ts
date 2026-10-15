/** Thống kê tiến độ cho trang "Tiến độ học tập": lượt nộp theo kết quả và tỷ lệ hoàn thành theo chủ đề. Hàm thuần. */
export interface StatsSubmission {
  exerciseId: string;
  status: string;
}

export interface StatsExercise {
  id: string;
  tags: string[];
}

export interface TopicProgress {
  tag: string;
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

/** Tag chỉ để đánh dấu khối lớp (vd 'lop6-9'), không phải chủ đề học. */
const isMetaTag = (tag: string) => /^lop\d/i.test(tag);
const MAX_TOPICS = 8;

export function computeLearnerStats(submissions: StatsSubmission[], exercises: StatsExercise[]): LearnerStats {
  const count = (s: string) => submissions.filter((x) => x.status === s).length;
  const ac = count('AC');
  const wa = count('WA');
  const tle = count('TLE');
  const re = count('RE');
  const ce = count('CE');
  const graded = ac + wa + tle + re + ce;

  const solvedIds = new Set(submissions.filter((s) => s.status === 'AC').map((s) => s.exerciseId));
  const byTag = new Map<string, { solved: number; total: number }>();
  for (const ex of exercises) {
    for (const tag of new Set(ex.tags ?? [])) {
      if (isMetaTag(tag)) continue;
      const t = byTag.get(tag) ?? { solved: 0, total: 0 };
      t.total += 1;
      if (solvedIds.has(ex.id)) t.solved += 1;
      byTag.set(tag, t);
    }
  }
  const topics = [...byTag.entries()]
    .map(([tag, t]) => ({ tag, solved: t.solved, total: t.total, percent: Math.round((t.solved / t.total) * 100) }))
    .sort((a, b) => b.total - a.total || a.tag.localeCompare(b.tag))
    .slice(0, MAX_TOPICS);

  return {
    submissions: { total: submissions.length, ac, wa, tle, re, ce },
    acRate: graded ? Math.round((ac / graded) * 100) : 0,
    solvedExercises: exercises.filter((e) => solvedIds.has(e.id)).length,
    totalExercises: exercises.length,
    topics,
  };
}
