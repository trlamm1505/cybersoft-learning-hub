/**
 * Gom các tag rời rạc (có tới hàng chục tag, mỗi tag 1-2 bài) về vài NHÓM CHỦ ĐỀ có nghĩa để vẽ
 * "Tỷ lệ hoàn thành theo chủ đề". Mỗi bài thuộc đúng một nhóm nên % = số bài AC / tổng bài của nhóm.
 * Bài chưa gắn tag (10 bài gốc) được suy ra nhóm từ slug/tiêu đề để không bị rơi khỏi biểu đồ.
 */
export interface TopicGroup {
  key: string;
  label: string;
  /** Tag (slug tiếng Anh) thuộc nhóm. */
  tags: string[];
  /** Gợi ý từ slug/tiêu đề cho bài không có tag. */
  keywords: RegExp;
}

/** Thứ tự = độ ưu tiên: nhóm cụ thể đứng trước nhóm chung chung. */
export const TOPIC_GROUPS: TopicGroup[] = [
  {
    key: 'dp',
    label: 'Quy hoạch động',
    tags: ['dp', 'coin-change', 'lis'],
    keywords: /quy-hoach-dong|dynamic/i,
  },
  {
    key: 'graph',
    label: 'Đồ thị',
    tags: ['graph', 'bfs', 'dfs', 'shortest-path', 'union-find'],
    keywords: /do-thi|graph/i,
  },
  {
    key: 'binary-search',
    label: 'Tìm kiếm nhị phân',
    tags: ['binary-search', 'binary-search-on-answer', 'lower-bound', 'upper-bound', 'rotated-array'],
    keywords: /nhi-phan|binary/i,
  },
  {
    key: 'greedy',
    label: 'Tham lam',
    tags: ['greedy', 'greedy-check', 'greedy-trap', 'interval-scheduling', 'intervals', 'jump-game'],
    keywords: /tham-lam|greedy/i,
  },
  {
    key: 'sorting',
    label: 'Sắp xếp & chia để trị',
    tags: ['sorting', 'sort', 'merge-sort', 'divide-and-conquer', 'counting', 'custom-comparator'],
    keywords: /sap-xep|sort/i,
  },
  {
    key: 'data-structures',
    label: 'Cấu trúc dữ liệu & kỹ thuật',
    tags: ['hashmap', 'two-pointer', 'heap', 'complexity', 'stack', 'queue'],
    keywords: /hashmap|two-pointer|heap/i,
  },
  {
    key: 'sql',
    label: 'SQL & dữ liệu',
    tags: ['sql', 'data'],
    keywords: /sql/i,
  },
  {
    key: 'simulation',
    label: 'Mô phỏng & game',
    tags: ['simulation', 'game-logic', 'turn-based'],
    keywords: /game|mo-phong/i,
  },
  {
    key: 'functions',
    label: 'Hàm & đệ quy',
    tags: ['function', 'recursion', 'recursion-or-loop'],
    keywords: /(^|-)ham-|de-quy|recursion/i,
  },
  {
    key: 'lists',
    label: 'Danh sách, chuỗi & ma trận',
    tags: ['list', 'array', 'arrays', 'set', 'matrix', 'string', 'multi-line'],
    keywords: /danh-sach|chuoi|ma-tran|dao-nguoc|palindrome|tim-so-lon|sap-xep|mang/i,
  },
  {
    key: 'loops',
    label: 'Vòng lặp',
    tags: ['loop', 'loops', 'for', 'while', 'fibonacci'],
    keywords: /fibonacci|vong-lap|loop/i,
  },
  {
    key: 'math',
    label: 'Số học & đếm',
    tags: ['so-hoc', 'dem', 'edge-case'],
    keywords: /nguyen-to|uoc-chung|so-hoc|tinh-tong|tong-/i,
  },
  {
    key: 'conditions',
    label: 'Điều kiện',
    tags: ['conditional'],
    keywords: /chan-le|dieu-kien|so-sanh/i,
  },
  {
    key: 'basics',
    label: 'Nhập xuất & cơ bản',
    tags: ['input-output', 'float', 'python', 'co-ban'],
    keywords: /nhap|xuat|co-ban|bien/i,
  },
];

export const OTHER_GROUP: Pick<TopicGroup, 'key' | 'label'> = { key: 'other', label: 'Chủ đề khác' };

/** Tag chỉ để đánh dấu khối lớp (vd 'lop6-9'), không phải chủ đề học. */
const isMetaTag = (tag: string) => /^lop\d/i.test(tag);

export interface TopicSource {
  slug?: string;
  title?: string;
  tags?: string[];
}

export function topicGroupOf(ex: TopicSource): Pick<TopicGroup, 'key' | 'label'> {
  const tags = (ex.tags ?? []).map((t) => t.toLowerCase()).filter((t) => !isMetaTag(t));
  if (tags.length > 0) {
    for (const g of TOPIC_GROUPS) {
      if (g.tags.some((t) => tags.includes(t))) return g;
    }
  }
  const haystack = `${ex.slug ?? ''} ${ex.title ?? ''}`.toLowerCase();
  for (const g of TOPIC_GROUPS) {
    if (haystack.trim() && g.keywords.test(haystack)) return g;
  }
  return OTHER_GROUP;
}
