#!/usr/bin/env node
/**
 * Seed 4 cuộc thi mở không giới hạn thời gian + 14 học sinh mẫu đã nộp bài, để Bảng xếp hạng từng cuộc thi có dữ liệu:
 *   node scripts/seed-contests.js --dry-run   # chỉ in kế hoạch
 *   node scripts/seed-contests.js             # ghi vào CSDL trong BE/.env (idempotent, upsert theo slug)
 *   node scripts/seed-contests.js --remove    # gỡ đúng dữ liệu mẫu này
 *
 * - 2 cuộc thi Khối 6–9 (trắc nghiệm Python + bài code Python) và 2 cuộc thi Khối 10–12 (trắc nghiệm thuật toán + bài
 *   Algo Judge). Thời gian: bắt đầu 14/10/2026, kết thúc 31/12/2099 (đang diễn ra), mỗi thí sinh có 14.400 phút (mức tối
 *   đa hệ thống cho phép) kể từ lúc bấm "Vào thi".
 * - 14 học sinh mẫu = 7 học sinh Khối 6–9 (xếp hạng trên 2 cuộc thi 6–9) + 7 học sinh Khối 10–12 (xếp hạng trên 2 cuộc thi
 *   10–12), vì cuộc thi riêng một khối không nhận học sinh khác khối. Tài khoản có cờ isSeedContestDemo, mật khẩu ngẫu nhiên
 *   (không đăng nhập được).
 * - Không bao giờ xóa dữ liệu thật: --remove chỉ gỡ bài nộp/tài khoản mẫu và các cuộc thi mẫu không còn ai thật tham gia.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const h = require('./lib/setup-helpers');

const BE = path.join(__dirname, '..', 'BE');
const envText = fs.existsSync(path.join(BE, '.env')) ? fs.readFileSync(path.join(BE, '.env'), 'utf8') : '';
const uri = process.env.DATABASE_URL || h.readEnvValue(envText, 'DATABASE_URL') || '';
const dryRun = process.argv.includes('--dry-run');
const remove = process.argv.includes('--remove');

const START = new Date('2026-10-14T00:00:00.000Z');
const END = new Date('2099-12-31T23:59:59.000Z');
const SEED_TAG = 'seed-contest-algo';

/** 16 câu trắc nghiệm thuật toán cho Khối 10–12 (chỉ dùng trong cuộc thi mẫu). */
const q = (content, options, correct, explanation, difficulty = 'MEDIUM') => ({
  content,
  options: ['A', 'B', 'C', 'D'].map((key, i) => ({ key, text: options[i], isCorrect: key === correct })),
  explanation,
  difficulty,
  category: 'Algorithm',
  points: 10,
  tags: [SEED_TAG, 'algorithm'],
  gradeBands: ['10-12'],
});
const ALGO_QUESTIONS = [
  q('Độ phức tạp thời gian của tìm kiếm nhị phân trên mảng đã sắp xếp có n phần tử là gì?', ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], 'B', 'Mỗi bước loại một nửa khoảng tìm kiếm nên cần khoảng log2(n) bước.'),
  q('Cấu trúc dữ liệu nào hoạt động theo nguyên tắc vào sau ra trước (LIFO)?', ['Hàng đợi (Queue)', 'Ngăn xếp (Stack)', 'Bảng băm (Hash table)', 'Cây nhị phân'], 'B', 'Ngăn xếp lấy phần tử được thêm vào gần nhất ra trước.', 'EASY'),
  q('Thuật toán sắp xếp nào luôn có độ phức tạp O(n log n) trong cả trường hợp xấu nhất?', ['Quick sort (chọn pivot cố định)', 'Bubble sort', 'Merge sort', 'Insertion sort'], 'C', 'Merge sort luôn chia đôi rồi trộn nên xấu nhất vẫn là O(n log n).'),
  q('Duyệt đồ thị theo chiều rộng (BFS) cần dùng cấu trúc dữ liệu nào?', ['Ngăn xếp', 'Hàng đợi', 'Heap', 'Bảng băm'], 'B', 'BFS thăm theo từng lớp nên cần hàng đợi (FIFO).', 'EASY'),
  q('Thao tác tra cứu trung bình trên bảng băm (hash table) có độ phức tạp là?', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 'A', 'Với hàm băm tốt, tra cứu trung bình là hằng số.', 'EASY'),
  q('Quy hoạch động hiệu quả khi bài toán có tính chất nào?', ['Không có bài toán con trùng lặp', 'Có các bài toán con trùng lặp và cấu trúc con tối ưu', 'Dữ liệu luôn đã sắp xếp', 'Chỉ làm việc với đồ thị có hướng'], 'B', 'Lưu lại lời giải các bài toán con trùng lặp để không tính lại.'),
  q('Thuật toán Dijkstra KHÔNG cho kết quả đúng khi đồ thị có điều kiện nào?', ['Có cạnh với trọng số âm', 'Có chu trình', 'Có nhiều đỉnh', 'Là đồ thị vô hướng'], 'A', 'Dijkstra giả định trọng số không âm; cạnh âm làm thứ tự chốt đỉnh sai.', 'HARD'),
  q('Trường hợp xấu nhất của Quick sort với pivot chọn kém là?', ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], 'C', 'Khi mỗi lần chia chỉ tách được 1 phần tử, tổng chi phí là O(n²).'),
  q('Chèn một phần tử vào ĐẦU danh sách liên kết đơn có độ phức tạp là?', ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'], 'C', 'Chỉ cần đổi con trỏ đầu danh sách.', 'EASY'),
  q('Sắp xếp topo (topological sort) chỉ áp dụng được cho loại đồ thị nào?', ['Đồ thị vô hướng liên thông', 'Đồ thị có hướng không chu trình (DAG)', 'Cây nhị phân tìm kiếm', 'Đồ thị đầy đủ'], 'B', 'Nếu có chu trình thì không tồn tại thứ tự tuyến tính thỏa mọi cạnh.'),
  q('Lấy phần tử nhỏ nhất ra khỏi min-heap có n phần tử mất thời gian?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 'B', 'Lấy gốc rồi sift-down mất O(log n).'),
  q('Thêm phần tử vào cuối mảng động (vector/list) có chi phí khấu hao (amortized) là?', ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], 'C', 'Thỉnh thoảng phải cấp phát lại nhưng trung bình mỗi lần thêm là O(1).'),
  q('Mảng cộng dồn (prefix sum) giúp tính tổng một đoạn bất kỳ trong thời gian?', ['O(n)', 'O(1) sau bước tiền xử lý O(n)', 'O(log n)', 'O(n²)'], 'B', 'Tổng đoạn [l, r] = pre[r] − pre[l−1].'),
  q('Bài toán chọn tối đa số hoạt động không giao nhau được giải đúng bằng chiến lược tham lam nào?', ['Chọn hoạt động bắt đầu sớm nhất', 'Chọn hoạt động ngắn nhất', 'Chọn hoạt động kết thúc sớm nhất', 'Chọn hoạt động bắt đầu muộn nhất'], 'C', 'Chọn hoạt động kết thúc sớm nhất để chừa nhiều chỗ nhất cho các hoạt động sau.', 'HARD'),
  q('Tìm số vùng liên thông của đồ thị vô hướng có thể dùng thuật toán nào?', ['DFS hoặc BFS', 'Binary search', 'Merge sort', 'Counting sort'], 'A', 'Mỗi lần khởi động DFS/BFS từ một đỉnh chưa thăm là một vùng liên thông mới.'),
  q('Kỹ thuật "hai con trỏ" thường dùng hiệu quả nhất trên dữ liệu như thế nào?', ['Mảng đã sắp xếp hoặc có tính đơn điệu', 'Đồ thị trọng số âm', 'Cây không cân bằng', 'Chuỗi rỗng'], 'A', 'Tính đơn điệu cho phép di chuyển hai con trỏ mà không bỏ sót đáp án.'),
];

const KIDS_69 = ['Nguyễn Hoàng Nam', 'Trần Thu Hà', 'Lê Minh Quân', 'Phạm Ngọc Anh', 'Hoàng Gia Bảo', 'Đỗ Khánh Linh', 'Vũ Đức Huy'];
const KIDS_1012 = ['Bùi Quang Minh', 'Đặng Phương Thảo', 'Ngô Thành Đạt', 'Lý Hải Yến', 'Trịnh Tuấn Kiệt', 'Mai Bảo Châu', 'Phan Nhật Long'];

/** Điểm mẫu từng học sinh (quiz/100, code/100) và phút nộp sau mốc bắt đầu: tổng điểm khác nhau nên xếp hạng rõ ràng. */
const SCORE_PLAN = [
  { quiz: 100, code: 100, quizAt: 42, codeAt: 95 },
  { quiz: 90, code: 100, quizAt: 38, codeAt: 120 },
  { quiz: 100, code: 80, quizAt: 55, codeAt: 150 },
  { quiz: 80, code: 80, quizAt: 61, codeAt: 175 },
  { quiz: 70, code: 100, quizAt: 70, codeAt: 205 },
  { quiz: 60, code: 40, quizAt: 80, codeAt: 240 },
  { quiz: 40, code: 20, quizAt: 90, codeAt: 300 },
];

const CONTESTS = [
  {
    slug: 'thi-python-co-ban-khoi-6-9-vong-1',
    title: 'Thi Python Cơ Bản — Khối 6–9 (Vòng 1)',
    description: 'Trắc nghiệm Python căn bản kết hợp bài code Tính tổng hai số nguyên. Cuộc thi mở, làm bài lúc nào cũng được.',
    gradeBand: '6-9',
    quiz: { title: 'Trắc nghiệm Python căn bản (phần 1)', slug: 'trac-nghiem-python-can-ban-1', from: 0, count: 10, bank: 'python' },
    coding: { exerciseSlug: 'tinh-tong-hai-so-nguyen', title: 'Tính tổng hai số nguyên' },
  },
  {
    slug: 'thu-thach-python-khoi-6-9-vong-2',
    title: 'Thử thách Python — Khối 6–9 (Vòng 2)',
    description: 'Trắc nghiệm Python nâng cao nhẹ và bài code Kiểm tra số nguyên tố. Cuộc thi mở, làm bài lúc nào cũng được.',
    gradeBand: '6-9',
    quiz: { title: 'Trắc nghiệm Python căn bản (phần 2)', slug: 'trac-nghiem-python-can-ban-2', from: 10, count: 10, bank: 'python' },
    coding: { exerciseSlug: 'kiem-tra-so-nguyen-to', title: 'Kiểm tra số nguyên tố' },
  },
  {
    slug: 'thuat-toan-khoi-10-12-vong-1',
    title: 'Thuật toán Khối 10–12 (Vòng 1)',
    description: 'Trắc nghiệm thuật toán và bài Algo Judge Đếm cặp có tổng bằng target. Cuộc thi mở, làm bài lúc nào cũng được.',
    gradeBand: '10-12',
    quiz: { title: 'Trắc nghiệm thuật toán (phần 1)', slug: 'trac-nghiem-thuat-toan-1', from: 0, count: 8, bank: 'algo' },
    coding: { exerciseSlug: 'day15-dem-cap-tong-bang-target', title: 'Đếm cặp có tổng bằng target' },
  },
  {
    slug: 'thuat-toan-khoi-10-12-vong-2',
    title: 'Thuật toán Khối 10–12 (Vòng 2)',
    description: 'Trắc nghiệm thuật toán và bài Algo Judge Giá trị xuất hiện nhiều nhất trong dãy lớn. Cuộc thi mở, làm bài lúc nào cũng được.',
    gradeBand: '10-12',
    quiz: { title: 'Trắc nghiệm thuật toán (phần 2)', slug: 'trac-nghiem-thuat-toan-2', from: 8, count: 8, bank: 'algo' },
    coding: { exerciseSlug: 'day15-gia-tri-xuat-hien-nhieu-nhat', title: 'Giá trị xuất hiện nhiều nhất trong dãy lớn' },
  },
];

(async () => {
  if (!uri) { console.error('Thiếu DATABASE_URL.'); process.exit(1); }
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const bcrypt = require(path.join(BE, 'node_modules', 'bcrypt'));
  console.log(`CSDL: ${uri.replace(/(:\/\/[^:/@]+:)[^@]*@/, '$1***@')}${dryRun ? '  [dry-run]' : ''}${remove ? '  [remove]' : ''}`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    const db = mongoose.connection.db;
    const users = db.collection('users');
    const contests = db.collection('contests');
    const subs = db.collection('contest_submissions');
    const questions = db.collection('questions');

    // ---------- Gỡ ----------
    if (remove) {
      const seeded = await users.find({ isSeedContestDemo: true }, { projection: { _id: 1 } }).toArray();
      const ids = seeded.map((u) => String(u._id));
      if (dryRun) { console.log(`Sẽ gỡ ${ids.length} học sinh mẫu và bài nộp của họ.`); return; }
      const s = await subs.deleteMany({ studentId: { $in: ids } });
      await contests.updateMany({ slug: { $in: CONTESTS.map((c) => c.slug) } }, { $pull: { registrations: { studentId: { $in: ids } } } });
      const u = await users.deleteMany({ isSeedContestDemo: true });
      console.log(`Đã gỡ ${u.deletedCount} học sinh mẫu và ${s.deletedCount} bài nộp.`);
      for (const c of CONTESTS) {
        const doc = await contests.findOne({ slug: c.slug });
        if (!doc) continue;
        const real = (doc.registrations || []).length + (await subs.countDocuments({ contestId: String(doc._id) }));
        if (real === 0) { await contests.deleteOne({ _id: doc._id }); console.log(`  đã xóa cuộc thi mẫu ${c.slug}`); }
        else console.log(`  giữ lại ${c.slug}: đã có người dùng thật tham gia`);
      }
      const referenced = await contests.countDocuments({ 'problems.questionIds': { $exists: true, $ne: [] }, slug: { $nin: CONTESTS.map((c) => c.slug) } });
      void referenced;
      const qd = await questions.deleteMany({ tags: SEED_TAG });
      console.log(`  đã xóa ${qd.deletedCount} câu hỏi thuật toán mẫu.`);
      return;
    }

    // ---------- Câu hỏi ----------
    const now = new Date();
    if (!dryRun) {
      for (const qq of ALGO_QUESTIONS) {
        await questions.updateOne({ content: qq.content, tags: SEED_TAG }, { $set: { ...qq, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true });
      }
    }
    const algoIds = (await questions.find({ tags: SEED_TAG }, { projection: { _id: 1 } }).sort({ _id: 1 }).toArray()).map((d) => String(d._id));
    const pyIds = (await questions.find({ category: 'Python', gradeBands: '6-9' }, { projection: { _id: 1 } }).sort({ _id: 1 }).toArray()).map((d) => String(d._id));
    console.log(`Câu hỏi: ${algoIds.length || ALGO_QUESTIONS.length} câu thuật toán (mẫu), ${pyIds.length} câu Python cho Khối 6–9.`);

    // ---------- Học sinh mẫu ----------
    const pwHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
    const people = [
      ...KIDS_69.map((fullName, i) => ({ fullName, ageGroup: '6-9', email: `seed-contest-6-9-${i + 1}@demo.cybersoft.local`, plan: SCORE_PLAN[i] })),
      ...KIDS_1012.map((fullName, i) => ({ fullName, ageGroup: '10-12', email: `seed-contest-10-12-${i + 1}@demo.cybersoft.local`, plan: SCORE_PLAN[i] })),
    ];
    const idByEmail = new Map();
    for (const p of people) {
      if (dryRun) { idByEmail.set(p.email, p.email); continue; }
      const res = await users.findOneAndUpdate(
        { email: p.email },
        {
          $set: { fullName: p.fullName, role: 'STUDENT', ageGroup: p.ageGroup, status: 'ACTIVE', isSeedContestDemo: true, updatedAt: now },
          $setOnInsert: { email: p.email, password: pwHash, phone: '', bio: '', createdAt: now },
        },
        { upsert: true, returnDocument: 'after' },
      );
      idByEmail.set(p.email, String(res._id));
    }
    console.log(`Học sinh mẫu: ${people.length} (7 Khối 6–9 + 7 Khối 10–12).`);

    // ---------- Cuộc thi + bài nộp ----------
    let subCount = 0;
    for (const c of CONTESTS) {
      const bankIds = c.quiz.bank === 'python' ? pyIds : algoIds;
      const quizIds = bankIds.slice(c.quiz.from, c.quiz.from + c.quiz.count);
      const problems = [
        { source: 'bank', questionIds: quizIds, title: c.quiz.title, slug: c.quiz.slug, type: 'quiz', points: 100, order: 1 },
        { source: 'exercise', exerciseSlug: c.coding.exerciseSlug, title: c.coding.title, slug: c.coding.exerciseSlug, type: 'coding', points: 100, order: 2 },
      ];
      const ex = await db.collection('exercises').findOne({ slug: c.coding.exerciseSlug }, { projection: { _id: 1, testCases: 1 } });
      console.log(`- ${c.slug} [${c.gradeBand}]: quiz ${quizIds.length} câu + code "${c.coding.exerciseSlug}"${ex ? '' : '  (!!) KHÔNG tìm thấy bài code'}`);
      if (dryRun) { subCount += 7 * 2; continue; }
      if (quizIds.length < c.quiz.count) throw new Error(`Thiếu câu hỏi cho ${c.slug}: cần ${c.quiz.count}, có ${quizIds.length}`);
      if (!ex) throw new Error(`Không có bài code ${c.coding.exerciseSlug}`);

      await contests.updateOne(
        { slug: c.slug },
        {
          $set: {
            title: c.title, description: c.description, startTime: START, endTime: END, durationMinutes: 14400, problems,
            status: 'published', authorId: 'teacher-1', integrityEnabled: true, gradeBand: c.gradeBand, updatedAt: now,
          },
          $setOnInsert: { slug: c.slug, registrations: [], createdAt: now },
        },
        { upsert: true },
      );
      const contest = await contests.findOne({ slug: c.slug });
      const contestId = String(contest._id);

      for (const p of people.filter((x) => x.ageGroup === c.gradeBand)) {
        const studentId = idByEmail.get(p.email);
        await contests.updateOne(
          { _id: contest._id, 'registrations.studentId': { $ne: studentId } },
          { $push: { registrations: { studentId, studentName: p.fullName, registeredAt: new Date(START.getTime() + 10 * 60000) } } },
        );
        const mk = (problemSlug, problemType, score, minutes) => ({
          contestId, problemSlug, problemType, studentId, studentName: p.fullName, score, maxPoints: 100,
          verdict: score === 100 ? 'AC' : score === 0 ? 'WA' : 'PARTIAL', passedCount: score / 10, totalCount: 10,
          submittedAt: new Date(START.getTime() + minutes * 60000), isLate: false,
        });
        const rows = [mk(c.quiz.slug, 'quiz', p.plan.quiz, p.plan.quizAt), mk(c.coding.exerciseSlug, 'coding', p.plan.code, p.plan.codeAt)];
        for (const row of rows) {
          await subs.updateOne({ contestId, problemSlug: row.problemSlug, studentId }, { $set: { ...row, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true });
          subCount++;
        }
      }
    }
    console.log(dryRun ? `Sẽ ghi ${subCount} bài nộp.` : `Xong: 4 cuộc thi, 14 học sinh, ${subCount} bài nộp.`);
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
