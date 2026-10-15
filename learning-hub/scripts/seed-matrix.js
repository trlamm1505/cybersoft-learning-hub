#!/usr/bin/env node
/**
 * Seed 4 bài mẫu theo ma trận nhóm đối tượng x loại lab, AN TOÀN cho CSDL dùng chung:
 *   node scripts/seed-matrix.js            # ghi vào CSDL trong BE/.env (DATABASE_URL)
 *   node scripts/seed-matrix.js --dry-run  # chỉ in sẽ làm gì, không ghi
 *
 * - Mỗi bài có slug ổn định; slug được đánh unique index trước khi upsert.
 * - Chỉ dùng findOneAndUpdate({ slug }, { $set }, { upsert: true }): chạy bao nhiêu lần cũng ra
 *   cùng kết quả, KHÔNG có deleteMany/drop, không đụng bất kỳ bài nào ngoài 4 slug dưới đây.
 * - Bài mẫu không có authorId (chỉ ADMIN sửa/xóa được qua API), tránh gán nhầm cho một giảng viên.
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/setup-helpers');

const BE = path.join(__dirname, '..', 'BE');

// Phải khớp BE/src/modules-api/exercise/exercise-matrix.ts.
const MATRIX = {
  K3_5: ['PUZZLE_BLOCK'],
  K6_9: ['PYTHON_CODE'],
  K10_12: ['ALGO_JUDGE'],
  CAREER_ADULT: ['DATA_SQL', 'AI_PROMPT', 'TESTER_QA'],
};

const ITEMS = [
  {
    slug: 'k3-5-puzzle-collect-stars',
    title: 'Xếp khối thu thập ngôi sao',
    description: 'Kéo các khối lệnh để đưa chú robot đi qua mê cung và thu thập đủ 3 ngôi sao.',
    type: 'CODE_BLOCK',
    difficulty: 'EASY',
    points: 10,
    targetGroup: 'K3_5',
    labType: 'PUZZLE_BLOCK',
    gradeBand: '3-5',
    tags: ['block', 'puzzle'],
  },
  {
    slug: 'k6-9-python-sum-two-numbers',
    title: 'Python: Tổng hai số',
    description: 'Đọc hai số nguyên a và b (mỗi số một dòng) và in ra tổng a + b.',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    starterCode: 'a = int(input())\nb = int(input())\n# in ra tổng\n',
    targetGroup: 'K6_9',
    labType: 'PYTHON_CODE',
    gradeBand: '6-9',
    tags: ['python', 'co-ban'],
    testCases: [{ input: '1\n2\n', expectedOutput: '3', isHidden: false }],
    hiddenTestCases: [
      { input: '-5\n5\n', expectedOutput: '0', isHidden: true },
      { input: '100\n250\n', expectedOutput: '350', isHidden: true },
    ],
    officialSolution: 'a = int(input())\nb = int(input())\nprint(a + b)\n',
  },
  {
    slug: 'k10-12-algo-max-of-array',
    title: 'Thuật toán: Phần tử lớn nhất',
    description: 'Dòng 1 là n, dòng 2 là n số nguyên cách nhau bởi dấu cách. In ra phần tử lớn nhất.',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 20,
    timeLimitMs: 2000,
    targetGroup: 'K10_12',
    labType: 'ALGO_JUDGE',
    gradeBand: '10-12',
    tags: ['algorithm', 'array'],
    testCases: [{ input: '3\n1 5 2\n', expectedOutput: '5', isHidden: false }],
    hiddenTestCases: [
      { input: '1\n-7\n', expectedOutput: '-7', isHidden: true },
      { input: '5\n3 9 9 1 0\n', expectedOutput: '9', isHidden: true },
    ],
    officialSolution: 'n = int(input())\nprint(max(map(int, input().split())))\n',
  },
  {
    slug: 'career-sql-sales-overview',
    title: 'SQL: Tổng quan doanh thu bán hàng',
    description: 'Viết truy vấn SQL tính tổng doanh thu theo từng tháng từ bảng đơn hàng.',
    type: 'SQL_LAB',
    difficulty: 'MEDIUM',
    points: 30,
    targetGroup: 'CAREER_ADULT',
    labType: 'DATA_SQL',
    tags: ['sql', 'data'],
  },
];

/** Lỗi nếu cặp (targetGroup, labType) của một bài sai ma trận. */
function assertMatrix(item) {
  if (!(MATRIX[item.targetGroup] || []).includes(item.labType)) {
    throw new Error(`Bài "${item.slug}" sai ma trận: ${item.targetGroup} không nhận ${item.labType}`);
  }
  if (!item.slug) throw new Error('Thiếu slug');
}

/**
 * Upsert theo slug. `collection` là collection 'exercises' của driver. Dùng lại được cho bất kỳ
 * danh sách bài nào (kể cả bài tạm của verify-matrix-security.js).
 */
async function upsertItems(collection, items, { dryRun = false } = {}) {
  items.forEach(assertMatrix);
  if (!dryRun) await collection.createIndex({ slug: 1 }, { unique: true });
  const out = [];
  for (const item of items) {
    if (dryRun) { out.push({ slug: item.slug, action: 'dry-run' }); continue; }
    const before = await collection.findOne({ slug: item.slug }, { projection: { _id: 1 } });
    await collection.findOneAndUpdate(
      { slug: item.slug },
      { $set: { ...item, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, returnDocument: 'after' },
    );
    out.push({ slug: item.slug, action: before ? 'updated' : 'created' });
  }
  return out;
}

function loadUri() {
  const envFile = path.join(BE, '.env');
  const text = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
  return process.env.DATABASE_URL || h.readEnvValue(text, 'DATABASE_URL') || '';
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const uri = loadUri();
  if (!uri) { console.error('Thiếu DATABASE_URL (biến môi trường hoặc BE/.env).'); process.exit(1); }
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  console.log(`CSDL: ${uri.replace(/(:\/\/[^:/@]+:)[^@]*@/, '$1***@')}${dryRun ? '  [dry-run]' : ''}`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    const col = mongoose.connection.db.collection('exercises');
    const res = await upsertItems(col, ITEMS, { dryRun });
    res.forEach((r) => console.log(`  ${r.action.padEnd(8)} ${r.slug}`));
    console.log(`Tổng số bài trong collection: ${await col.countDocuments()} (script chỉ đụng ${ITEMS.length} slug ở trên).`);
  } finally {
    await mongoose.disconnect();
  }
}

module.exports = { ITEMS, MATRIX, upsertItems, assertMatrix };
if (require.main === module) main().catch((e) => { console.error(e.message || e); process.exit(1); });
