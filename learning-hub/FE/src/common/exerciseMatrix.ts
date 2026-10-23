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
/** gradeBand khối 10-12 có hai nhãn lịch sử ('9-12' và '10-12'): quy về một khóa nhóm để không bài nào rơi khỏi Playground. */
const GRADE_TO_BAND: Record<string, string> = { '10-12': '9-12' };
export const bandOfExercise = (ex: { targetGroup?: string; gradeBand?: string }): string =>
  (ex.targetGroup && TARGET_TO_BAND[ex.targetGroup]) || (ex.gradeBand && (GRADE_TO_BAND[ex.gradeBand] ?? ex.gradeBand)) || UNGRADED;

/** Nhóm tuổi của học viên (3-5/6-9/10-12) -> khóa nhóm ở Playground; học viên chưa có nhóm tuổi là người lớn. */
export const bandOfStudent = (ageGroup?: string): string =>
  ageGroup === '10-12' ? '9-12' : ageGroup || 'CAREER_ADULT';

/**
 * Khối Teacher Studio được soạn đề (Day 30): chỉ 6–9 và 10–12. Lớp 3–5 là game Blockly dựng sẵn, khối Người lớn dùng
 * các phòng Lab riêng. Nhóm + loại lab tự suy ra từ khối (mỗi khối chỉ có một loại), nên form không còn ô chọn lab.
 */
export const TEACHER_BANDS = [
  { band: '6-9', targetGroup: 'K6_9', labType: 'PYTHON_CODE', label: 'Khối 6–9' },
  { band: '10-12', targetGroup: 'K10_12', labType: 'ALGO_JUDGE', label: 'Khối 10–12' },
] as const;
export type TeacherBand = (typeof TEACHER_BANDS)[number]['band'];
export const teacherBandOf = (targetGroup?: string | null): TeacherBand | null =>
  TEACHER_BANDS.find((b) => b.targetGroup === targetGroup)?.band ?? null;
