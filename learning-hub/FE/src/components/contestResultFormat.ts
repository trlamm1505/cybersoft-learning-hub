/** Nhãn cho bài trắc nghiệm đã nộp nhưng điểm chỉ công bố khi contest kết thúc. */
export const PENDING_SCORE_LABEL = 'Đang chờ công bố điểm khi contest kết thúc';

interface ScoredProblem {
  score: number;
  maxPoints: number;
  /** Quiz trong lúc thi: BE đã chấm và lưu nhưng chưa công bố đúng/sai. */
  pendingScore?: boolean;
}

/** Điểm hiển thị cho từng bài: không in "0 / N" cho bài đang chờ công bố. */
export function formatProblemScore(p: ScoredProblem): string {
  return p.pendingScore ? PENDING_SCORE_LABEL : `${p.score} / ${p.maxPoints}đ`;
}

/** Số bài đang chờ công bố điểm (để ghi chú tổng điểm chưa gồm các bài này). */
export function countPendingScores(problems: ScoredProblem[]): number {
  return problems.filter((p) => p.pendingScore).length;
}
