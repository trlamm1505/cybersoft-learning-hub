import { studentExerciseFilter } from './exercise-matrix';

/**
 * Danh mục Code Playground (Day 31): với học viên Khối 6-9 và 10-12, /playground CHỈ là bộ bài lộ trình chuẩn cố định của khối,
 * đánh số #1..#N theo orderInTopic. Đây là NGUỒN DUY NHẤT cho danh sách, thứ tự, mở khóa tuần tự và mẫu số của "Tiến độ học tập":
 * mọi nơi (GET /exercises, GET /exercises/playground, nộp bài, /learner/stats, gợi ý bài) dùng chung các hàm dưới đây.
 *
 * Không thuộc lộ trình (không bao giờ hiện ở Playground, không làm đổi mẫu số tiến độ):
 *  - bài Ngân hàng đề của giảng viên/Admin (bankOnly: true) - chỉ để giao bài theo Ngày / Cuộc thi;
 *  - bài mẫu của Teacher Dashboard (demo-dash-*), bài ma trận mẫu, bài cũ chưa có thứ tự (không có topic + orderInTopic);
 *  - bài SQL / Data Lab / AI Lab / Tester Lab (khối 6-9 và 10-12 không học các phần này).
 */
export const PLAYGROUND_BANDS = ['6-9', '10-12'] as const;
export type PlaygroundBand = (typeof PLAYGROUND_BANDS)[number];

/** Chủ đề (topic) của lộ trình chuẩn từng khối: bộ bài Ngày 14 (Python căn bản) và Ngày 15 (luyện thi thuật toán). */
export const PLAYGROUND_TRACK_TOPIC: Record<PlaygroundBand, string> = {
  '6-9': 'python-fundamentals',
  '10-12': 'algorithm-contest-prep',
};

/** Phòng Lab / tag thuộc Data - AI - Tester: không bao giờ vào lộ trình Python của học sinh phổ thông. */
const NON_PYTHON_LAB_TYPES = ['DATA_SQL', 'AI_PROMPT', 'TESTER_QA', 'DA_LAB', 'AI_LAB'];
const NON_PYTHON_TAGS = ['sql', 'da-lab', 'ai-lab', 'tester-lab'];

/**
 * Bài mẫu của Teacher Dashboard (demo-dash-*): chỉ để script audit/dữ liệu demo (bảo mật, out-tab, thống kê) dùng, nằm lại trong CSDL nhưng
 * KHÔNG hiện ở mọi danh sách chọn bài của giảng viên / Admin (giao bài, Ngân hàng đề, đề Cuộc thi, Soạn đề) vì chỉ là rác trên giao diện.
 */
export const DEMO_EXERCISE_SLUG = /^demo-dash-/;
export const notDemoExercise = { $not: DEMO_EXERCISE_SLUG } as const;

export const isPlaygroundBand = (v: unknown): v is PlaygroundBand => (PLAYGROUND_BANDS as readonly unknown[]).includes(v);

/** Khối Playground của một học viên (theo ageGroup); null = không có lộ trình Playground (Lớp 3-5, Người đi làm, chưa chọn khối). */
export const playgroundBandOf = (ageGroup?: string | null): PlaygroundBand | null => (isPlaygroundBand(ageGroup) ? ageGroup : null);

/** Bộ lọc Mongo của lộ trình chuẩn một khối (dùng cho find và $match của aggregate). */
export function playgroundFilter(band: PlaygroundBand): Record<string, unknown> {
  return {
    $and: [
      {
        resource_id: { $exists: false },
        bankOnly: { $ne: true },
        type: 'CODE_TEXT',
        topic: PLAYGROUND_TRACK_TOPIC[band],
        orderInTopic: { $gte: 1 },
        labType: { $nin: NON_PYTHON_LAB_TYPES },
        tags: { $nin: NON_PYTHON_TAGS },
      },
      studentExerciseFilter(band),
    ],
  };
}

/** Bài đã nạp có thuộc lộ trình chuẩn của khối không (dùng khi nộp bài để quyết định có áp khóa tuần tự). */
export function isOnPlaygroundTrack(
  ex: { bankOnly?: boolean; resource_id?: string | null; type?: string; topic?: string | null; orderInTopic?: number | null; labType?: string | null; tags?: string[] | null },
  band: PlaygroundBand,
): boolean {
  return (
    ex.bankOnly !== true &&
    !ex.resource_id &&
    ex.type === 'CODE_TEXT' &&
    ex.topic === PLAYGROUND_TRACK_TOPIC[band] &&
    (ex.orderInTopic ?? 0) >= 1 &&
    !(ex.labType && NON_PYTHON_LAB_TYPES.includes(ex.labType)) &&
    !(ex.tags ?? []).some((t) => NON_PYTHON_TAGS.includes(t))
  );
}

/** Bài/bài giảng nghiêng về SQL - Data - AI - Tester: lọc khỏi mọi danh sách dành cho học viên khối 6-9 và 10-12. */
export function isSqlOrLabItem(x: { slug?: string | null; topic?: string | null; tags?: string[] | null; labType?: string | null; type?: string | null; resource_id?: string | null }): boolean {
  return (
    !!x.resource_id ||
    /sql/i.test(x.slug ?? '') ||
    /^(sql|da-lab|ai-lab|tester)/i.test(x.topic ?? '') ||
    (!!x.labType && NON_PYTHON_LAB_TYPES.includes(x.labType)) ||
    (x.tags ?? []).some((t) => NON_PYTHON_TAGS.includes(t)) ||
    x.type === 'SQL_LAB' ||
    x.type === 'DA_INSIGHT'
  );
}

/**
 * "Đã hoàn thành" ở Playground = có bài nộp AC khi LUYỆN TẬP TỰ DO (không phải bài giao của lớp) và không bị đánh dấu lệch thứ tự.
 * Bài giao theo Ngày của lớp không theo thứ tự lộ trình nên không được làm nhảy tiến độ Playground (và ngược lại). Một định nghĩa duy nhất
 * cho Playground, "Tiến độ học tập" và gợi ý bài: bảo đảm X/N khớp nhau.
 */
export const PRACTICE_AC_FILTER = { status: 'AC', assignmentId: { $exists: false }, outOfSequence: { $ne: true } } as const;

export type PlaygroundStatus = 'completed' | 'available' | 'locked';

/**
 * Mở khóa tuần tự. `keys` là các bài theo thứ tự #1..#N, `solved` là tập bài đã AC.
 *  - Bài đã hoàn thành: luôn mở lại xem/làm lại được ('completed').
 *  - Bài đầu tiên CHƯA hoàn thành trong chuỗi: 'available' (đang mở). Bài #1 luôn mở khi chưa làm.
 *  - Mọi bài chưa hoàn thành đứng sau bài đó: 'locked' (bài #k chỉ mở khi #1..#(k-1) đều đã hoàn thành).
 */
export function playgroundStatuses<K>(keys: readonly K[], solved: ReadonlySet<K>): PlaygroundStatus[] {
  const frontier = keys.findIndex((k) => !solved.has(k));
  return keys.map((k, i) => (solved.has(k) ? 'completed' : i === frontier ? 'available' : 'locked'));
}
