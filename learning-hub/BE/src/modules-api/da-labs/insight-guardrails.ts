/**
 * Guardrail cho phần chấm Insight bằng LLM.
 *
 * Mục tiêu: điểm chỉ được cho dựa trên LẬP LUẬN có trong bài, không dựa trên
 * việc bài có chứa từ khóa. Ba lớp:
 * 1. Trước khi gọi LLM: từ chối bài chỉ là danh sách từ khóa hoặc lặp từ
 *    (không cho điểm, chỉ yêu cầu viết lại thành lập luận).
 * 2. Prompt: cấm model cho điểm vì xuất hiện thuật ngữ, bắt trích dẫn nguyên
 *    văn một mệnh đề làm bằng chứng cho từng tiêu chí.
 * 3. Sau khi LLM trả về: tiêu chí có điểm mà bằng chứng không nằm trong bài,
 *    hoặc bằng chứng chỉ là một cụm từ ngắn (tức là chấm theo từ khóa), bị
 *    hủy điểm và gắn cờ.
 * Hệ thống không có đường chấm dự phòng bằng từ khóa: không có LLM thì bài
 * chuyển sang chờ giảng viên chấm.
 */

export interface InsightRubricCriterion {
  id: string;
  title: string;
  maxPoints: number;
  description: string;
}

export interface LlmCriterionGrade {
  id: string;
  score: number;
  evidence_quote: string;
  reasoning: string;
}

export interface LlmInsightGrade {
  criteria: LlmCriterionGrade[];
  overall_feedback: string;
}

export interface GuardedCriterion {
  id: string;
  title: string;
  score: number;
  maxPoints: number;
  evidence: string;
  reasoning: string;
  /** Lý do guardrail hủy điểm của tiêu chí, nếu có. */
  flag?: string;
}

/** Bằng chứng tối thiểu phải là một mệnh đề, không phải một từ khóa. */
export const MIN_EVIDENCE_WORDS = 6;
export const MIN_REASONING_WORDS = 8;
const MIN_ANSWER_WORDS = 40;
const MIN_ARGUMENT_SENTENCES = 2;
const MIN_UNIQUE_WORD_RATIO = 0.35;

const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}%.,]+/u)
    .map((w) => w.replace(/^[.,]+|[.,]+$/g, ''))
    .filter(Boolean);

const normalizeForMatch = (text: string) =>
  text
    .toLowerCase()
    .replace(/[“”"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Lớp 1: kiểm tra bài có phải lập luận hay chỉ là liệt kê/nhồi từ khóa. */
export function checkAnswerIsArgument(
  answer: string,
): { ok: true } | { ok: false; reason: string } {
  const all = words(answer);
  if (all.length < MIN_ANSWER_WORDS) {
    return {
      ok: false,
      reason: `Câu trả lời cần ít nhất ${MIN_ANSWER_WORDS} từ, trình bày thành lập luận có số liệu.`,
    };
  }
  const sentences = answer
    .split(/[.!?\n]+/)
    .filter((s) => words(s).length >= MIN_EVIDENCE_WORDS);
  if (sentences.length < MIN_ARGUMENT_SENTENCES) {
    return {
      ok: false,
      reason:
        'Câu trả lời giống danh sách từ khóa. Hãy viết thành các câu hoàn chỉnh: nhận định, số liệu chứng minh, đề xuất.',
    };
  }
  const uniqueRatio = new Set(all).size / all.length;
  if (uniqueRatio < MIN_UNIQUE_WORD_RATIO) {
    return {
      ok: false,
      reason: 'Câu trả lời lặp lại cùng một nhóm từ quá nhiều lần.',
    };
  }
  return { ok: true };
}

/**
 * Lớp 3: kiểm tra đầu ra của LLM. Trả về null khi đầu ra sai cấu trúc (thiếu
 * tiêu chí, điểm ngoài khoảng) để service chuyển bài sang chấm tay.
 */
export function applyOutputGuardrails(
  answer: string,
  rubric: InsightRubricCriterion[],
  raw: LlmInsightGrade | null | undefined,
): GuardedCriterion[] | null {
  if (!raw || !Array.isArray(raw.criteria)) return null;
  if (raw.criteria.length !== rubric.length) return null;

  const normalizedAnswer = normalizeForMatch(answer);
  const result: GuardedCriterion[] = [];

  for (const criterion of rubric) {
    const graded = raw.criteria.find((c) => c.id === criterion.id);
    if (
      !graded ||
      typeof graded.score !== 'number' ||
      !Number.isFinite(graded.score) ||
      graded.score < 0 ||
      graded.score > criterion.maxPoints
    ) {
      return null;
    }

    const evidence = (graded.evidence_quote ?? '').trim();
    const reasoning = (graded.reasoning ?? '').trim();
    const base = {
      id: criterion.id,
      title: criterion.title,
      maxPoints: criterion.maxPoints,
      evidence,
      reasoning,
    };

    if (graded.score === 0) {
      result.push({ ...base, score: 0 });
      continue;
    }
    if (words(evidence).length < MIN_EVIDENCE_WORDS) {
      result.push({
        ...base,
        score: 0,
        flag: 'Bằng chứng chỉ là từ khóa, không phải một lập luận trong bài: hủy điểm tiêu chí.',
      });
      continue;
    }
    if (!normalizedAnswer.includes(normalizeForMatch(evidence))) {
      result.push({
        ...base,
        score: 0,
        flag: 'Bằng chứng không có nguyên văn trong bài làm: hủy điểm tiêu chí.',
      });
      continue;
    }
    if (words(reasoning).length < MIN_REASONING_WORDS) {
      result.push({
        ...base,
        score: 0,
        flag: 'Nhận xét của AI không giải thích lý do cho điểm: hủy điểm tiêu chí.',
      });
      continue;
    }
    result.push({ ...base, score: graded.score });
  }
  return result;
}
