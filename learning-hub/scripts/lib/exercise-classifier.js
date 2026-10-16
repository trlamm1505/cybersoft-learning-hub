/**
 * Phân loại bài code vào khối của Ngân hàng đề: '6-9' (căn bản) hoặc '10-12' (nâng cao/chuyên sâu).
 * Hàm thuần (không chạm CSDL) để dùng cho scripts/classify-existing-exercises.js, seed-all và kiểm thử bằng `node --test`.
 *
 * Thứ tự ưu tiên:
 *  1. bankBand đã có (đã phân loại hoặc do AI Tạo Đề gắn): giữ nguyên.
 *  2. Nhãn có sẵn do con người đặt: targetGroup (K6_9 / K10_12), rồi gradeBand ('6-9' / '9-12' / '10-12').
 *     Đây cũng chính là thứ quyết định học viên nào thấy bài trong Code Playground nên phải trùng với khối của Ngân hàng đề.
 *  3. Bài chưa có nhãn nào: suy từ nội dung (slug, tiêu đề, topic, tag): có dấu hiệu nâng cao (quy hoạch động, đồ thị, tìm kiếm nhị phân,
 *     heap, tham lam, chia để trị, sắp xếp tùy biến, độ phức tạp...) -> 10-12, ngược lại nếu độ khó HARD và không có tag căn bản -> 10-12,
 *     còn lại -> 6-9 (vòng lặp, chuỗi, mảng 1 chiều, if-else...).
 */
const ADVANCED = [
  'dp', 'dynamic-programming', 'quy-hoach-dong', 'graph', 'do-thi', 'bfs', 'dfs', 'dijkstra', 'union-find', 'tree', 'cay', 'trie',
  'binary-search', 'tim-kiem-nhi-phan', 'binary-search-on-answer', 'lower-bound', 'upper-bound', 'heap', 'priority-queue',
  'custom-comparator', 'greedy', 'tham-lam', 'divide-and-conquer', 'merge-sort', 'segment-tree', 'prefix-sum', 'two-pointer',
  'complexity', 'do-phuc-tap', 'hashmap', 'intervals', 'interval-scheduling', 'bitmask', 'backtracking', 'lop10-12', 'algorithm-contest-prep',
];
const BASIC = ['input-output', 'loop', 'for', 'while', 'string', 'list', 'if-else', 'conditional', 'python-fundamentals', 'lop6-9', 'co-ban', 'function', 'simulation'];

const norm = (s) => String(s ?? '').toLowerCase();
const tokens = (ex) => {
  const parts = [ex.slug, ex.title, ex.topic, ...(Array.isArray(ex.tags) ? ex.tags : [])].map(norm).join(' ');
  return parts;
};
const hasAny = (text, words) => words.some((w) => new RegExp(`(^|[^a-z0-9])${w.replace(/[-]/g, '[- ]?')}([^a-z0-9]|$)`).test(text));

/** @returns {{ band: '6-9'|'10-12', reason: string, changed: boolean }} */
function classifyExercise(ex) {
  if (ex.bankBand === '6-9' || ex.bankBand === '10-12') return { band: ex.bankBand, reason: 'đã có bankBand', changed: false };
  if (ex.targetGroup === 'K10_12') return { band: '10-12', reason: 'targetGroup K10_12', changed: true };
  if (ex.targetGroup === 'K6_9') return { band: '6-9', reason: 'targetGroup K6_9', changed: true };
  if (ex.gradeBand === '9-12' || ex.gradeBand === '10-12') return { band: '10-12', reason: `gradeBand ${ex.gradeBand}`, changed: true };
  if (ex.gradeBand === '6-9') return { band: '6-9', reason: 'gradeBand 6-9', changed: true };
  const text = tokens(ex);
  if (hasAny(text, ADVANCED)) return { band: '10-12', reason: 'nội dung nâng cao (thuật toán chuyên sâu)', changed: true };
  if (ex.difficulty === 'HARD' && !hasAny(text, BASIC)) return { band: '10-12', reason: 'độ khó HARD, không có dấu hiệu căn bản', changed: true };
  return { band: '6-9', reason: 'nội dung căn bản', changed: true };
}

module.exports = { classifyExercise, ADVANCED, BASIC };
