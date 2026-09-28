import { INITIAL_EXERCISES } from '../../data/initial-exercises';
import { INITIAL_EXERCISES_DAY14 } from '../../data/initial-exercises-day14';
import { INITIAL_EXERCISES_DAY15 } from '../../data/initial-exercises-day15';
import { ProblemDraft } from './problem-generator.types';

export interface DuplicateMatch {
  existingSlug: string;
  existingTitle: string;
  similarity: number; // 0..1, Jaccard trên tập từ của title+description
}

// Toàn bộ exercise đã seed sẵn (3 nguồn tĩnh, không cần kết nối Mongo) — dùng
// làm tập đối chiếu "đã có trong catalog" cho bước kiểm tra trùng lặp.
const EXISTING_EXERCISES: Array<{ slug: string; title: string; description: string }> =
  [...INITIAL_EXERCISES, ...INITIAL_EXERCISES_DAY14, ...INITIAL_EXERCISES_DAY15];

const STOPWORDS = new Set([
  'va', 'la', 'mot', 'cac', 'cho', 'ra', 'theo', 'tren', 'trong', 'voi',
  'khong', 'neu', 'thi', 'de', 'cua', 'nhau', 'moi', 'duoc', 'hay', 'nhung',
]);

function toWordSet(text: string): Set<string> {
  const normalized = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ');

  return new Set(
    normalized.split(/\s+/).filter((w) => w.length > 1 && !STOPWORDS.has(w)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const w of a) if (b.has(w)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Ngưỡng cảnh báo trùng lặp — không phải cứng để tự động loại bài, chỉ để gắn
// cờ nghi vấn vào validation report cho bước "kiểm tra trùng lặp thủ công"
// theo đúng điều kiện nghiệm thu của đề bài ngày 19. Người review tự quyết
// định cuối cùng có coi là trùng hay không.
const SIMILARITY_WARNING_THRESHOLD = 0.5;

/**
 * So khớp text đơn giản (Jaccard trên tập từ) giữa draft mới sinh và toàn bộ
 * exercise đã có trong catalog, KHÔNG phải semantic similarity bằng embedding
 * (repo backend không có model embedding nào cài sẵn). Trả về những exercise
 * có độ tương đồng vượt ngưỡng, sắp theo giảm dần, để người review đối chiếu
 * thủ công — đúng tinh thần "kiểm tra trùng lặp thủ công hoặc semantic" ở mức
 * đơn giản, không giả vờ đây là kiểm tra semantic thật.
 */
export function findDuplicateCandidates(draft: ProblemDraft): DuplicateMatch[] {
  const draftWords = toWordSet(`${draft.title} ${draft.description}`);

  return EXISTING_EXERCISES.map((existing) => ({
    existingSlug: existing.slug,
    existingTitle: existing.title,
    similarity: jaccard(
      draftWords,
      toWordSet(`${existing.title} ${existing.description}`),
    ),
  }))
    .filter((m) => m.similarity >= SIMILARITY_WARNING_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity);
}
