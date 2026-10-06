import { EVALUATION_SETS } from './local-registry/evaluation-set-fixture';
import type {
  EvalExpectedBehavior,
  RegistryEvalItem,
} from './dataset-contract.types';

/**
 * Mỗi bài AI Lab dùng một "lát" câu hỏi nhỏ của bộ kiểm định (vd `eval-cs-rag-abstain-v1`),
 * còn Registry thật của TTS 01 chỉ phát hành hai bộ lớn: golden RAG (`EVAL-*`) và
 * policy/curriculum (`Q001`...`Q100`). Lát là phần của Learning Hub: chỉ khai báo
 * danh sách `question_id`, nội dung câu hỏi và đáp án chuẩn luôn lấy từ Registry thật
 * nên TTS 01 sửa đáp án thì bài lab theo ngay.
 */
export const GOLDEN_SET_ID = 'eval-rag-golden-v1';
export const POLICY_SET_ID = 'eval-policy-curriculum-v1';

export interface EvalSlice {
  id: string;
  name: string;
  /** Thứ tự câu hỏi trong bài lab. */
  questionIds: string[];
}

/** Bộ nguồn trên Registry thật chứa câu hỏi này. */
export function sourceSetOf(questionId: string): string {
  return questionId.startsWith('EVAL-') ? GOLDEN_SET_ID : POLICY_SET_ID;
}

export function getEvalSlice(id: string): EvalSlice | undefined {
  if (!Object.prototype.hasOwnProperty.call(EVALUATION_SETS, id)) {
    return undefined;
  }
  const set = (
    EVALUATION_SETS as unknown as Record<
      string,
      { id: string; name: string; items: RegistryEvalItem[] }
    >
  )[id];
  return {
    id: set.id,
    name: set.name,
    questionIds: set.items.map((i) => i.question_id),
  };
}

/**
 * Bộ policy/curriculum của TTS 01 ghi `expected_behavior` bằng câu mô tả rubric và
 * `category` bằng chủ đề (Academic Policy...), còn bộ chấm của Learning Hub cần
 * ANSWER/ABSTAIN và loại câu hỏi. Dịch theo rubric; rubric lạ thì báo lỗi thay vì đoán.
 */
const RUBRIC_TO_KIND: Array<[RegExp, EvalExpectedBehavior, string]> = [
  [/^return factual answer/i, 'ANSWER', 'standard_qa'],
  [/^synthesize multiple/i, 'ANSWER', 'ambiguous_multihop'],
  [
    /^acknowledge missing information/i,
    'ABSTAIN',
    'unanswerable_out_of_domain',
  ],
  [/^identify misleading premise/i, 'ANSWER', 'adversarial_distractor'],
];

export function normalizeEvalKind(item: {
  expected_behavior: string;
  category?: string;
}): { expected_behavior: EvalExpectedBehavior; category: string } | null {
  const raw = String(item.expected_behavior ?? '').trim();
  if (raw === 'ANSWER' || raw === 'ABSTAIN') {
    return { expected_behavior: raw, category: item.category ?? '' };
  }
  // Schema TTS 01 còn liệt kê REJECT, GUARD_BLOCKED: đều là "không được trả lời theo yêu cầu".
  if (raw === 'REJECT' || raw === 'GUARD_BLOCKED') {
    return { expected_behavior: 'ABSTAIN', category: item.category ?? '' };
  }
  const hit = RUBRIC_TO_KIND.find(([re]) => re.test(raw));
  return hit ? { expected_behavior: hit[1], category: hit[2] } : null;
}
