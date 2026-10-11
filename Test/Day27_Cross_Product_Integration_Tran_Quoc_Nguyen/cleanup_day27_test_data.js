#!/usr/bin/env node
/**
 * Dọn dữ liệu thử của Ngày 26/27 trong DB dev (mặc định CHỈ ĐẾM, không xóa).
 *
 *   node Test\Day27_...\cleanup_day27_test_data.js                      # dry-run: liệt kê số bản ghi sẽ xóa
 *   node Test\Day27_...\cleanup_day27_test_data.js --execute            # xóa thật
 *   node ... --since 2026-10-10T10:00:00Z --email student@gmail.com     # đổi mốc thời gian / tài khoản
 *
 * Phạm vi xóa: chỉ bản ghi của MỘT tài khoản (mặc định student@gmail.com) tạo từ mốc --since
 * (mặc định 2026-10-10T10:00:00Z, trước lần smoke Day 26 trên bản clone) ở đúng 2 collection
 * do chuỗi Day 27 tạo: da_lab_submissions, ai_lab_submissions.
 * Không đụng quizattempts (có thể là bài quiz thật của học viên), người dùng, bài tập, câu hỏi,
 * bài giảng, cuộc thi hay dữ liệu của tài khoản khác.
 * Nếu bạn đã tự làm bài bằng student@gmail.com sau mốc đó, hãy chạy dry-run và đổi --since trước.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', 'learning-hub', 'BE');
const arg = (name, def) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const EXECUTE = process.argv.includes('--execute');
const EMAIL = arg('--email', 'student@gmail.com');
const SINCE = new Date(arg('--since', '2026-10-10T10:00:00Z'));
if (Number.isNaN(SINCE.getTime())) {
  console.error('--since không hợp lệ (ví dụ 2026-10-10T10:00:00Z)');
  process.exit(2);
}

function readEnv(file, key) {
  try {
    const m = fs.readFileSync(file, 'utf8').match(new RegExp('^' + key + '\\s*=\\s*"?([^"\\r\\n]*)"?', 'm'));
    return m ? m[1].trim() : '';
  } catch {
    return '';
  }
}

(async () => {
  const mongoose = require(path.join(ROOT, 'node_modules', 'mongoose'));
  const uri = readEnv(path.join(ROOT, '.env'), 'DATABASE_URL') || 'mongodb://localhost:27017/cybersoft';
  if (!/localhost|127\.0\.0\.1/.test(uri)) {
    console.error('DATABASE_URL không phải máy local, dừng để tránh xóa nhầm:', uri.replace(/\/\/.*@/, '//***@'));
    process.exit(2);
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ email: EMAIL });
  if (!user) {
    console.error('Không tìm thấy tài khoản', EMAIL);
    await mongoose.disconnect();
    process.exit(2);
  }
  const idStr = String(user._id);
  const idObj = user._id;
  console.log(`DB: ${uri}\nTài khoản: ${EMAIL} (${idStr})\nTừ: ${SINCE.toISOString()}\nChế độ: ${EXECUTE ? 'XÓA THẬT' : 'dry-run (chỉ đếm)'}\n`);

  const targets = ['da_lab_submissions', 'ai_lab_submissions'];
  let total = 0;
  for (const name of targets) {
    const filter = { userId: { $in: [idStr, idObj] }, createdAt: { $gte: SINCE } };
    const col = db.collection(name);
    const n = await col.countDocuments(filter);
    total += n;
    if (EXECUTE && n > 0) {
      const res = await col.deleteMany(filter);
      console.log(`${name.padEnd(20)} ${n} bản ghi -> đã xóa ${res.deletedCount}`);
    } else {
      console.log(`${name.padEnd(20)} ${n} bản ghi`);
    }
  }
  console.log(`\nTổng: ${total} bản ghi ${EXECUTE ? 'đã xử lý' : 'sẽ bị xóa nếu thêm --execute'}`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error('Lỗi:', e.message);
  process.exit(1);
});
