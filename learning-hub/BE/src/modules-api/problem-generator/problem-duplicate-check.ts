import { INITIAL_EXERCISES } from '../../data/initial-exercises';
import { INITIAL_EXERCISES_DAY14 } from '../../data/initial-exercises-day14';
import { INITIAL_EXERCISES_DAY15 } from '../../data/initial-exercises-day15';
import { ProblemDraft } from './problem-generator.types';

export interface DuplicateMatch {
  existingSlug: string;
  existingTitle: string;
  similarity: number; // 0..1, Jaccard trên tập từ của title+description
  // true khi slug hoặc title khớp TUYỆT ĐỐI với một bài đã có — chắc chắn là
  // trùng lặp thật, KHÔNG cho phép giáo viên override để lưu đè (khác với
  // cảnh báo similarity thường, vốn có thể là false positive do đề bài na ná
  // nhau nhưng thực chất khác). Chỉ hard block mới chặn saveDraft(forceSave).
  isHardBlock: boolean;
}

export interface ExistingExerciseForDuplicateCheck {
  slug: string;
  title: string;
  description: string;
}

// Fallback CHỈ dùng khi không có kết nối Mongo sẵn (run-pipeline.ts chạy như
// CLI script độc lập, không có NestJS DI/Mongoose connection) — 3 nguồn tĩnh
// nạp lúc build, không phản ánh những bài giáo viên/AI vừa lưu vào DB thật.
// Đường dẫn có kết nối Mongo (ProblemGeneratorService, chạy trong NestJS)
// PHẢI truyền existingExercises lấy trực tiếp từ exerciseModel, không dùng
// fallback này, để bài vừa lưu bởi người khác cũng được đối chiếu.
export const STATIC_FIXTURE_EXERCISES: ExistingExerciseForDuplicateCheck[] = [
  ...INITIAL_EXERCISES,
  ...INITIAL_EXERCISES_DAY14,
  ...INITIAL_EXERCISES_DAY15,
];

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

// Ngưỡng gắn cờ nghi vấn (đưa vào validation report để người review đối
// chiếu thủ công) — KHÔNG tự động loại bài. Đây là mức "cảnh báo vàng":
// similarity nội dung (Jaccard trên tập từ title+description) từ 50% trở
// lên đã đáng để cảnh báo, nhưng vẫn CHO PHÉP giáo viên override nếu tự xác
// nhận sau khi đọc lại (đúng tinh thần human-in-the-loop — máy chỉ cảnh báo,
// người quyết định cuối cùng).
const SIMILARITY_WARNING_THRESHOLD = 0.5;

// Ngưỡng chặn cứng (hard block) — similarity nội dung cao tới mức gần như
// chắc chắn là bản sao (không phải hai đề bài tình cờ dùng từ giống nhau).
// Vượt ngưỡng này thì KHÔNG cho override bằng forceSave, phải tự sửa nội
// dung hoặc sinh bài khác trước, vì đây không còn là "nghi vấn" mà gần như
// chắc chắn trùng.
const SIMILARITY_HARD_BLOCK_THRESHOLD = 0.95;

function normalizeForExactMatch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * So khớp text đơn giản (Jaccard trên tập từ) giữa draft mới sinh và tập
 * exercise "đã có" do CALLER truyền vào (existingExercises) — KHÔNG tự đọc
 * fixture tĩnh nữa. Caller trong đường dẫn có Mongo (ProblemGeneratorService)
 * phải truyền dữ liệu query trực tiếp từ collection `exercises` đang chạy,
 * để bài vừa được giáo viên khác lưu cũng nằm trong tập đối chiếu — trước
 * đây chỉ so khớp với 3 file fixture nạp lúc khởi động, bỏ sót mọi bài lưu
 * sau thời điểm build.
 *
 * KHÔNG phải semantic similarity bằng embedding (repo backend không có model
 * embedding nào cài sẵn) — chỉ Jaccard trên tập từ, đủ dùng cho bước gắn cờ
 * nghi vấn để người review đối chiếu thủ công.
 *
 * isHardBlock = true khi slug trùng tuyệt đối, title trùng tuyệt đối (sau
 * chuẩn hoá bỏ dấu/hoa-thường/khoảng trắng thừa), hoặc similarity nội dung
 * >= SIMILARITY_HARD_BLOCK_THRESHOLD — những trường hợp này không đưa vào
 * diện "chờ giáo viên xác nhận bỏ qua", vì gần như chắc chắn là bản sao.
 */
export function findDuplicateCandidates(
  draft: ProblemDraft,
  existingExercises: ExistingExerciseForDuplicateCheck[],
): DuplicateMatch[] {
  const draftWords = toWordSet(`${draft.title} ${draft.description}`);
  const draftSlug = draft.slug;
  const draftTitleNormalized = normalizeForExactMatch(draft.title);

  return existingExercises
    .map((existing) => {
      const similarity = jaccard(
        draftWords,
        toWordSet(`${existing.title} ${existing.description}`),
      );
      const exactSlugMatch = existing.slug === draftSlug;
      const exactTitleMatch =
        normalizeForExactMatch(existing.title) === draftTitleNormalized;

      return {
        existingSlug: existing.slug,
        existingTitle: existing.title,
        similarity,
        isHardBlock:
          exactSlugMatch ||
          exactTitleMatch ||
          similarity >= SIMILARITY_HARD_BLOCK_THRESHOLD,
      };
    })
    .filter((m) => m.similarity >= SIMILARITY_WARNING_THRESHOLD || m.isHardBlock)
    .sort((a, b) => b.similarity - a.similarity);
}
