import {
  MASTERY_STRONG_THRESHOLD,
  MASTERY_WEAK_THRESHOLD,
  MIN_ATTEMPTS_FOR_CONFIDENCE,
} from './mastery.calculator';
import {
  ExerciseSummary,
  RecommendedExercise,
  TagMastery,
} from './recommendation.types';

/**
 * Rule recommendation minh bạch, 3 nhóm gợi ý luôn được trả cùng lúc (khi có
 * đủ dữ liệu) để KHÔNG khoá học viên vào một đường duy nhất:
 *
 *  1. REMEDIATION — tag có mastery thấp nhất (đã thử >= ngưỡng tin cậy) hoặc
 *     tag có lần thử gần nhất là WA/lỗi. Mục tiêu: củng cố lỗ hổng rõ nhất.
 *  2. PROGRESSION — bài kế tiếp cùng tag đang mạnh nhất (đủ vững để đi tiếp)
 *     hoặc bài chưa làm ở tag đã quen. Mục tiêu: đi lên đúng lộ trình.
 *  3. EXPLORATION — một tag học viên CHƯA từng đụng tới. Mục tiêu: mở đường
 *     khác, tránh việc rule khoá cứng học viên vào các tag đã biết.
 *
 * Mỗi gợi ý luôn kèm `reason` giải thích bằng số liệu cụ thể (mastery %, số
 * lần thử) — không có "hộp đen".
 */
export function buildRecommendations(
  masteries: TagMastery[],
  exercises: ExerciseSummary[],
  solvedExerciseIds: Set<string>,
): RecommendedExercise[] {
  const recommendations: RecommendedExercise[] = [];
  const masteryByTag = new Map(masteries.map((m) => [m.tag, m]));
  const attemptedTags = new Set(masteries.map((m) => m.tag));

  const unsolvedByTag = (tag: string) =>
    exercises.filter(
      (ex) => ex.tags.includes(tag) && !solvedExerciseIds.has(ex.id),
    );

  // ---- 1. REMEDIATION ----
  const remediationCandidate = [...masteries]
    .filter((m) => m.attemptCount >= MIN_ATTEMPTS_FOR_CONFIDENCE)
    .sort((a, b) => a.masteryPercent - b.masteryPercent)[0];

  const recentFailureCandidate = [...masteries]
    .filter((m) => m.lastAttemptStatus !== 'AC')
    .sort((a, b) => b.lastAttemptAt.getTime() - a.lastAttemptAt.getTime())[0];

  const remediationTagInfo = remediationCandidate ?? recentFailureCandidate;
  if (remediationTagInfo) {
    const pool = unsolvedByTag(remediationTagInfo.tag);
    const exercise = pickEasiest(pool);
    if (exercise) {
      const reason = remediationCandidate
        ? `Mastery tag "${remediationTagInfo.tag}" đang ở ${remediationTagInfo.masteryPercent}% ` +
          `(${remediationTagInfo.acCount}/${remediationTagInfo.attemptCount} lần AC) — thấp nhất trong các tag đã làm, nên ôn lại tag này trước.`
        : `Lần thử gần nhất ở tag "${remediationTagInfo.tag}" chưa đạt (${remediationTagInfo.lastAttemptStatus}) — nên thử lại để củng cố ngay khi còn nhớ lỗi sai.`;
      recommendations.push({
        exercise,
        kind: 'REMEDIATION',
        tag: remediationTagInfo.tag,
        reason,
      });
    }
  }

  // ---- 2. PROGRESSION ----
  const strongTag = [...masteries]
    .filter(
      (m) =>
        m.masteryPercent >= MASTERY_STRONG_THRESHOLD &&
        m.attemptCount >= MIN_ATTEMPTS_FOR_CONFIDENCE,
    )
    .sort((a, b) => b.masteryPercent - a.masteryPercent)[0];

  // Nếu chưa tag nào đủ vững, vẫn cho progression theo tag đang làm nhiều nhất
  // (không để học viên đứng yên chỉ vì chưa đạt ngưỡng "strong").
  const mostPracticedTag = [...masteries].sort(
    (a, b) => b.attemptCount - a.attemptCount,
  )[0];

  // strongTag là tín hiệu rõ ràng ("đủ vững để đi tiếp") nên luôn được ưu
  // tiên dù trùng tag remediation; mostPracticedTag chỉ là fallback nên phải
  // tránh trùng tag remediation, nếu không 2/3 gợi ý sẽ dồn vào cùng một tag.
  const progressionTagInfo =
    strongTag ??
    (mostPracticedTag && mostPracticedTag.tag !== remediationTagInfo?.tag
      ? mostPracticedTag
      : undefined);
  if (progressionTagInfo) {
    const pool = unsolvedByTag(progressionTagInfo.tag);
    const exercise = pickHardestUnsolved(pool);
    if (exercise) {
      const reason = strongTag
        ? `Mastery tag "${progressionTagInfo.tag}" đã đạt ${progressionTagInfo.masteryPercent}% — đủ vững để làm bài khó hơn cùng tag này.`
        : `Đã luyện tag "${progressionTagInfo.tag}" nhiều nhất (${progressionTagInfo.attemptCount} lần thử) — tiếp tục bài chưa làm cùng tag để đi hết lộ trình.`;
      recommendations.push({
        exercise,
        kind: 'PROGRESSION',
        tag: progressionTagInfo.tag,
        reason,
      });
    }
  }

  // ---- 3. EXPLORATION ----
  const allTags = new Set(exercises.flatMap((ex) => ex.tags));
  const newTags = [...allTags].filter((tag) => !attemptedTags.has(tag));
  const explorationTag = newTags[0];
  if (explorationTag) {
    const pool = unsolvedByTag(explorationTag);
    const exercise = pickEasiest(pool);
    if (exercise) {
      recommendations.push({
        exercise,
        kind: 'EXPLORATION',
        tag: explorationTag,
        reason: `Bạn chưa từng thử tag "${explorationTag}" — thử một bài dễ để khám phá thêm kỹ năng mới, không nhất thiết phải đi theo đúng một lộ trình.`,
      });
    }
  }

  // Loại trùng exercise (hiếm khi xảy ra vì các nhánh ưu tiên tag khác nhau,
  // nhưng vẫn phòng trường hợp một bài rơi vào nhiều tag được chọn).
  const seen = new Set<string>();
  return recommendations.filter((r) => {
    if (seen.has(r.exercise.id)) return false;
    seen.add(r.exercise.id);
    return true;
  });
}

const DIFFICULTY_RANK: Record<string, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };

function pickEasiest(pool: ExerciseSummary[]): ExerciseSummary | undefined {
  return [...pool].sort(
    (a, b) =>
      (DIFFICULTY_RANK[a.difficulty] ?? 1) -
      (DIFFICULTY_RANK[b.difficulty] ?? 1),
  )[0];
}

function pickHardestUnsolved(
  pool: ExerciseSummary[],
): ExerciseSummary | undefined {
  return [...pool].sort(
    (a, b) =>
      (DIFFICULTY_RANK[b.difficulty] ?? 1) -
      (DIFFICULTY_RANK[a.difficulty] ?? 1),
  )[0];
}

export { MASTERY_WEAK_THRESHOLD, MASTERY_STRONG_THRESHOLD };
