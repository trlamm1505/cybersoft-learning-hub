/**
 * Ma trận tương thích nhóm đối tượng (targetGroup) và loại lab (labType) của
 * Exercise. Nguồn sự thật DUY NHẤT cho cả tạo mới, cập nhật một phần và seed.
 */
export const TARGET_GROUPS = ['K3_5', 'K6_9', 'K10_12', 'CAREER_ADULT'] as const;
export type TargetGroup = (typeof TARGET_GROUPS)[number];

export const LAB_TYPES = [
  'PUZZLE_BLOCK',
  'PYTHON_CODE',
  'ALGO_JUDGE',
  'DATA_SQL',
  'AI_PROMPT',
  'TESTER_QA',
] as const;
export type LabType = (typeof LAB_TYPES)[number];

export const GROUP_LAB_MATRIX: Record<TargetGroup, readonly LabType[]> = {
  K3_5: ['PUZZLE_BLOCK'],
  K6_9: ['PYTHON_CODE'],
  K10_12: ['ALGO_JUDGE'],
  CAREER_ADULT: ['DATA_SQL', 'AI_PROMPT', 'TESTER_QA'],
};

/** user.ageGroup (đã lưu trong CSDL) -> targetGroup của bài tập. */
const AGE_GROUP_TO_TARGET: Record<string, TargetGroup> = {
  '3-5': 'K3_5',
  '6-9': 'K6_9',
  '10-12': 'K10_12',
};

/** Học viên chưa có ageGroup (người đi làm/người lớn) thuộc nhóm CAREER_ADULT. */
export const targetGroupOfStudent = (ageGroup?: string | null): TargetGroup =>
  (ageGroup && AGE_GROUP_TO_TARGET[ageGroup]) || 'CAREER_ADULT';

/**
 * Trả về thông báo lỗi nếu cặp (targetGroup, labType) sai ma trận, ngược lại
 * undefined. Cả hai phải có cùng lúc: gọi với bản đã MERGE giữa document hiện
 * tại và payload cập nhật, không gọi với payload rời.
 */
export function matrixError(
  targetGroup: unknown,
  labType: unknown,
): string | undefined {
  if (!TARGET_GROUPS.includes(targetGroup as TargetGroup)) {
    return `targetGroup không hợp lệ (chỉ nhận ${TARGET_GROUPS.join(' | ')}).`;
  }
  if (!LAB_TYPES.includes(labType as LabType)) {
    return `labType không hợp lệ (chỉ nhận ${LAB_TYPES.join(' | ')}).`;
  }
  if (!GROUP_LAB_MATRIX[targetGroup as TargetGroup].includes(labType as LabType)) {
    return `Nhóm ${targetGroup} chỉ nhận labType ${GROUP_LAB_MATRIX[targetGroup as TargetGroup].join(' | ')}, không nhận ${labType}.`;
  }
  return undefined;
}
