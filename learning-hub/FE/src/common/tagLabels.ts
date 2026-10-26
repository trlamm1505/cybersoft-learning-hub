/**
 * Tên tiếng Việt cho các tag chủ đề của bài tập (trong CSDL tag là mã tiếng Anh viết tắt như "loop", "dp", "hashmap").
 * Tag lạ không có trong bảng được đọc thành chữ thường dễ đọc thay vì hiện mã thô.
 */
export const TAG_LABELS: Record<string, string> = {
  loop: 'Vòng lặp',
  loops: 'Vòng lặp',
  for: 'Vòng lặp for',
  while: 'Vòng lặp while',
  list: 'Danh sách',
  array: 'Mảng',
  arrays: 'Mảng',
  matrix: 'Ma trận',
  string: 'Chuỗi ký tự',
  set: 'Tập hợp',
  hashmap: 'Bảng băm',
  function: 'Hàm',
  recursion: 'Đệ quy',
  'recursion-or-loop': 'Đệ quy hoặc vòng lặp',
  conditional: 'Cấu trúc điều kiện',
  'input-output': 'Nhập xuất dữ liệu',
  'multi-line': 'Nhập xuất nhiều dòng',
  float: 'Số thực',
  'so-hoc': 'Số học',
  sorting: 'Sắp xếp',
  sort: 'Sắp xếp',
  'merge-sort': 'Sắp xếp trộn',
  'custom-comparator': 'Hàm so sánh tùy chỉnh',
  'binary-search': 'Tìm kiếm nhị phân',
  'binary-search-on-answer': 'Tìm kiếm nhị phân theo đáp án',
  'lower-bound': 'Cận dưới',
  'upper-bound': 'Cận trên',
  'rotated-array': 'Mảng đã xoay',
  'two-pointer': 'Hai con trỏ',
  greedy: 'Tham lam',
  'greedy-check': 'Kiểm tra tham lam',
  'greedy-trap': 'Cái bẫy của tham lam',
  'interval-scheduling': 'Lập lịch khoảng',
  intervals: 'Khoảng thời gian',
  dp: 'Quy hoạch động',
  lis: 'Dãy con tăng dài nhất',
  'coin-change': 'Đổi tiền',
  'jump-game': 'Bước nhảy',
  graph: 'Đồ thị',
  bfs: 'Duyệt theo chiều rộng (BFS)',
  dfs: 'Duyệt theo chiều sâu (DFS)',
  'shortest-path': 'Đường đi ngắn nhất',
  'union-find': 'Tập hợp rời nhau',
  heap: 'Hàng đợi ưu tiên (heap)',
  complexity: 'Độ phức tạp thuật toán',
  'divide-and-conquer': 'Chia để trị',
  counting: 'Đếm',
  dem: 'Đếm',
  simulation: 'Mô phỏng',
  'turn-based': 'Mô phỏng theo lượt',
  'game-logic': 'Logic trò chơi',
  'edge-case': 'Trường hợp biên',
  'co-ban': 'Kiến thức cơ bản',
  algorithm: 'Thuật toán',
  python: 'Python',
  sql: 'Truy vấn SQL',
  data: 'Dữ liệu',
  block: 'Xếp khối lệnh',
  puzzle: 'Câu đố logic',
};

/** Tag chỉ để đánh dấu khối lớp (vd "lop6-9"): không phải chủ đề học nên không hiển thị. */
export const isMetaTag = (tag: string): boolean => /^lop\d/i.test(tag);

export function tagLabel(tag: string): string {
  const known = TAG_LABELS[tag.toLowerCase()];
  if (known) return known;
  const words = tag.replace(/[-_]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : tag;
}
