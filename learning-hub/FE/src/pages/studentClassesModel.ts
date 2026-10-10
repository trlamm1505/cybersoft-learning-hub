import type { AssignmentStatus, MyClassExercise } from '../types/studentClasses';

export const STATUS_LABEL: Record<AssignmentStatus, string> = {
  NOT_STARTED: 'Chưa làm',
  ATTEMPTED: 'Đang làm',
  PASSED: 'Đã đạt',
};

/** Đường dẫn vào làm bài theo loại bài. Bài code mở thẳng trình soạn thảo qua ?slug=. */
export function exercisePath(type: string | null, slug: string): string {
  const s = encodeURIComponent(slug);
  switch (type) {
    case 'SQL_LAB':
    case 'DA_INSIGHT':
      return `/da-labs/${s}`;
    case 'AI_LAB':
      return `/ai-labs/${s}`;
    case 'QUIZ':
      return '/quiz';
    case 'CODE_BLOCK':
      return '/block-puzzle';
    default:
      return `/playground?slug=${s}`;
  }
}

export const actionLabel = (status: AssignmentStatus): string =>
  status === 'PASSED' ? 'Làm lại' : status === 'ATTEMPTED' ? 'Làm tiếp' : 'Làm bài';

/** Phần trăm bài đã đạt trong lớp (0 khi lớp chưa có bài). */
export const passedPercent = (passed: number, total: number): number =>
  total > 0 ? Math.round((passed / total) * 100) : 0;

/** Bài chưa đạt lên trước (đang làm rồi chưa làm), bài đã đạt xuống cuối; giữ nguyên thứ tự giảng viên xếp trong từng nhóm. */
export function sortAssignments(list: MyClassExercise[]): MyClassExercise[] {
  const rank: Record<AssignmentStatus, number> = { ATTEMPTED: 0, NOT_STARTED: 1, PASSED: 2 };
  return list
    .map((e, i) => ({ e, i }))
    .sort((a, b) => rank[a.e.status] - rank[b.e.status] || a.i - b.i)
    .map((x) => x.e);
}
