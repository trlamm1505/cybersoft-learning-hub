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
  CAREER_ADULT: 'CAREER_ADULT',
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

/**
 * gradeBand được phép với từng khối tuổi (bài 10-12 lưu là '9-12' hoặc '10-12'). null = không giới hạn theo khối
 * (người lớn chưa có ageGroup). Bài chưa gắn gradeBand là bài cũ, luôn được phép.
 */
export const allowedGradeBands = (ageGroup?: string | null): string[] | null => {
  if (ageGroup === '3-5') return ['3-5'];
  if (ageGroup === '6-9') return ['6-9'];
  if (ageGroup === '10-12') return ['9-12', '10-12'];
  if (ageGroup === 'CAREER_ADULT') return ['CAREER_ADULT'];
  return null;
};


// ----------------------------------------------------------------------------------------------------------------------------------
// Khối của Ngân hàng đề (AI Tạo Đề, chọn bài gán vào Ngày học / Cuộc thi): chỉ hai khối phổ thông có bài code.
// ----------------------------------------------------------------------------------------------------------------------------------
export const BANK_BANDS = ['6-9', '10-12'] as const;
export type BankBand = (typeof BANK_BANDS)[number];

export const normalizeBankBand = (v: unknown): BankBand | undefined => (BANK_BANDS as readonly string[]).includes(String(v)) ? (v as BankBand) : undefined;

/** Nhãn lưu trên bài: targetGroup / labType / gradeBand theo khối (khớp ma trận nhóm x lab). */
export const bankLabels = (band: BankBand): { targetGroup: TargetGroup; labType: LabType; gradeBand: string } =>
  band === '6-9' ? { targetGroup: 'K6_9', labType: 'PYTHON_CODE', gradeBand: '6-9' } : { targetGroup: 'K10_12', labType: 'ALGO_JUDGE', gradeBand: '9-12' };

/** Bộ lọc Mongo: bài thuộc khối (targetGroup, hoặc bài cũ chỉ có gradeBand). */
export const exerciseBandFilter = (band: BankBand): Record<string, unknown> => ({
  // bankBand (phân loại của Ngân hàng đề) được ưu tiên; bài chưa có thì xét targetGroup, rồi gradeBand.
  $or: [
    { bankBand: band },
    ...(band === '6-9'
      ? [{ bankBand: { $exists: false }, targetGroup: 'K6_9' }, { bankBand: { $exists: false }, targetGroup: { $exists: false }, gradeBand: '6-9' }]
      : [{ bankBand: { $exists: false }, targetGroup: 'K10_12' }, { bankBand: { $exists: false }, targetGroup: { $exists: false }, gradeBand: { $in: ['9-12', '10-12'] } }]),
  ],
});

/** Khối của một bài trong Ngân hàng đề (null: chưa phân loại). bankBand > targetGroup > gradeBand. */
export function bandOfExercise(ex: { bankBand?: string | null; targetGroup?: string | null; gradeBand?: string | null }): BankBand | null {
  if (ex.bankBand === '6-9' || ex.bankBand === '10-12') return ex.bankBand;
  if (ex.targetGroup === 'K6_9') return '6-9';
  if (ex.targetGroup === 'K10_12') return '10-12';
  if (ex.gradeBand === '6-9') return '6-9';
  if (ex.gradeBand === '9-12' || ex.gradeBand === '10-12') return '10-12';
  return null;
}

/** Câu trắc nghiệm: đúng khối hoặc câu cũ chưa gắn khối (hiện cho mọi khối). */
export const questionBandFilter = (band: BankBand): Record<string, unknown> => ({ $or: [{ gradeBands: band }, { gradeBands: { $exists: false } }] });

/** Khối của một lớp phổ thông (null với lớp khác). */
export const bandOfClass = (ageGroup?: string | null): BankBand | null => (ageGroup === '6-9' || ageGroup === '10-12' ? ageGroup : null);

/** Bài đã gắn khối khác với khối của lớp/cuộc thi thì không gán được (học viên sẽ bị chặn khi mở bài). Bài chưa gắn khối thì được. */
export function exerciseFitsBand(ex: { bankBand?: string | null; targetGroup?: string | null; gradeBand?: string | null }, band: BankBand): boolean {
  const own = bandOfExercise(ex);
  return own === null || own === band;
}
