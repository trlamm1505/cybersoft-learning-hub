import { GradedAttempt, TagMastery } from './recommendation.types';

// Dưới ngưỡng này coi là "yếu" (dùng để xếp remediation lên đầu và để test).
export const MASTERY_WEAK_THRESHOLD = 50;
// Từ ngưỡng này trở lên coi là "vững" (dùng để mở progression sang bài khó hơn).
export const MASTERY_STRONG_THRESHOLD = 80;
// Cần tối thiểu số lần nộp mới tin số liệu mastery của một tag (tránh 1 lần AC
// duy nhất bị coi là "vững 100%" ngay lập tức).
export const MIN_ATTEMPTS_FOR_CONFIDENCE = 3;

/**
 * Gom các attempt (đã chấm hoặc chưa) theo tag của exercise, rồi tính % AC
 * trên tổng số attempt liên quan tới tag đó. Một exercise nhiều tag thì một
 * attempt của nó được tính vào mastery của TẤT CẢ các tag đó — một bài tập
 * "vòng lặp + mảng" vừa là bằng chứng cho tag loop vừa cho tag array.
 */
export function computeTagMastery(attempts: GradedAttempt[]): TagMastery[] {
  const byTag = new Map<string, GradedAttempt[]>();

  for (const attempt of attempts) {
    // Bỏ qua các lượt còn đang chấm — chưa có kết quả AC/WA để tính vào mastery.
    if (attempt.status === 'QUEUED' || attempt.status === 'RUNNING') continue;

    for (const tag of attempt.tags) {
      const list = byTag.get(tag) ?? [];
      list.push(attempt);
      byTag.set(tag, list);
    }
  }

  const result: TagMastery[] = [];
  for (const [tag, list] of byTag.entries()) {
    const sorted = [...list].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const acCount = sorted.filter((a) => a.status === 'AC').length;
    const last = sorted[sorted.length - 1];

    result.push({
      tag,
      attemptCount: sorted.length,
      acCount,
      masteryPercent: Math.round((acCount / sorted.length) * 1000) / 10,
      lastAttemptStatus: last.status,
      lastAttemptAt: last.createdAt,
    });
  }

  return result.sort((a, b) => a.masteryPercent - b.masteryPercent);
}
