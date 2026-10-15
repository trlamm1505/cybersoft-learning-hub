/**
 * Ma trận nhóm đối tượng x loại lab, dùng chung cho form soạn bài và trang danh mục.
 * Phải khớp BE/src/modules-api/exercise/exercise-matrix.ts (BE vẫn kiểm tra lại, đây chỉ là gợi ý UI).
 */
export type TargetGroup = 'K3_5' | 'K6_9' | 'K10_12' | 'CAREER_ADULT';
export type LabType = 'PUZZLE_BLOCK' | 'PYTHON_CODE' | 'ALGO_JUDGE' | 'DATA_SQL' | 'AI_PROMPT' | 'TESTER_QA';

export const GROUP_LAB_MATRIX: Record<TargetGroup, readonly LabType[]> = {
  K3_5: ['PUZZLE_BLOCK'],
  K6_9: ['PYTHON_CODE'],
  K10_12: ['ALGO_JUDGE'],
  CAREER_ADULT: ['DATA_SQL', 'AI_PROMPT', 'TESTER_QA'],
};

export const TARGET_GROUP_OPTIONS: ReadonlyArray<{ value: TargetGroup; band: string; label: string }> = [
  { value: 'K3_5', band: '3-5', label: 'Lớp 3–5 (3-5)' },
  { value: 'K6_9', band: '6-9', label: 'Lớp 6–9 (6-9)' },
  { value: 'K10_12', band: '10-12', label: 'Lớp 10–12 (10-12)' },
  { value: 'CAREER_ADULT', band: 'CAREER_ADULT', label: 'Người lớn / Chuyên ngành (CAREER_ADULT)' },
];

export const LAB_TYPE_LABEL: Record<LabType, string> = {
  PUZZLE_BLOCK: 'Puzzle Block (xếp khối)',
  PYTHON_CODE: 'Python Code',
  ALGO_JUDGE: 'Algo Judge (thuật toán)',
  DATA_SQL: 'Data Lab (SQL)',
  AI_PROMPT: 'AI Lab (Prompting)',
  TESTER_QA: 'Tester Lab (Bug Report)',
};

/** Danh sách labType được phép của một nhóm (rỗng nếu nhóm không hợp lệ). */
export const labTypesFor = (group: TargetGroup | ''): readonly LabType[] => (group ? GROUP_LAB_MATRIX[group] : []);

/** Khi đổi nhóm: giữ labType cũ nếu vẫn hợp lệ, nhóm chỉ có 1 lab thì tự chọn, ngược lại để trống. */
export const labTypeAfterGroupChange = (group: TargetGroup | '', current: LabType | ''): LabType | '' => {
  const allowed = labTypesFor(group);
  if (current && allowed.includes(current)) return current;
  return allowed.length === 1 ? allowed[0] : '';
};

/** Khóa nhóm hiển thị ở Code Playground ('3-5' | '6-9' | '9-12' | 'CAREER_ADULT' | '__ungraded__'). */
export const UNGRADED = '__ungraded__';
const TARGET_TO_BAND: Record<string, string> = { K3_5: '3-5', K6_9: '6-9', K10_12: '9-12', CAREER_ADULT: 'CAREER_ADULT' };
export const bandOfExercise = (ex: { targetGroup?: string; gradeBand?: string }): string =>
  (ex.targetGroup && TARGET_TO_BAND[ex.targetGroup]) || ex.gradeBand || UNGRADED;

/** Nhóm tuổi của học viên (3-5/6-9/10-12) -> khóa nhóm ở Playground; học viên chưa có nhóm tuổi là người lớn. */
export const bandOfStudent = (ageGroup?: string): string =>
  ageGroup === '10-12' ? '9-12' : ageGroup || 'CAREER_ADULT';
