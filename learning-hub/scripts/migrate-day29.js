#!/usr/bin/env node
/**
 * Migration Day 29: dọn dữ liệu cũ cho khớp các bản vá Security & Privacy. Idempotent, chạy lại bao nhiêu lần cũng được.
 *
 *   node scripts/migrate-day29.js --dry-run   # chỉ in những gì sẽ đổi
 *   node scripts/migrate-day29.js             # áp dụng
 *
 * 1. Lớp học: gỡ id giảng viên/học viên "ma" (tài khoản đã xóa), sửa teacherId chính (C1).
 * 2. Lớp học: rút giảng viên/Admin còn nằm trong studentIds (học viên đã được nâng lên giảng viên) (M1).
 * 3. Tài khoản không phải học viên: bỏ ageGroup (M1). student@gmail.com mẫu: gán khối 10-12 nếu thiếu (M7).
 * 4. Học viên Lớp 3-5: bỏ phone/bio (tối thiểu hóa dữ liệu trẻ em, SEC-19/PRV-01).
 * 5. Bài tập chỉ có bankBand (vd demo-dash-ex-*): gắn targetGroup/labType/gradeBand theo khối để không lọt sang khối khác (H1).
 * 6. Bài giảng thiếu trường status: đặt 'draft' đúng mặc định của schema (không còn bị coi là đã xuất bản).
 * 7. Tạo TTL index: coach_messages (90 ngày, PRV-07) và revoked_tokens (theo hạn token, L3).
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/setup-helpers');
const { repairAllClasses } = require('./lib/class-integrity');

const BE = path.join(__dirname, '..', 'BE');
const envText = fs.readFileSync(path.join(BE, '.env'), 'utf8');
const uri = process.env.DATABASE_URL || h.readEnvValue(envText, 'DATABASE_URL');
const dryRun = process.argv.includes('--dry-run');
const COACH_TTL_SECONDS = 90 * 24 * 60 * 60;
const tag = dryRun ? '(dry-run) ' : '';

(async () => {
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const classes = db.collection('classrooms');
  const exercises = db.collection('exercises');
  const lessons = db.collection('lessons');
  const out = [];
  const say = (m) => {
    out.push(m);
    console.log(`  ${tag}${m}`);
  };
  try {
    console.log(`Migration Day 29${dryRun ? ' [dry-run]' : ''}`);

    // 1. Id "ma" trong lớp.
    const fixed = await repairAllClasses(db, { dryRun, log: (m) => say(`lớp ${m}`) });
    say(`1. Toàn vẹn lớp: ${fixed} lớp có id không còn tồn tại`);

    // 2. Giảng viên/Admin còn trong studentIds.
    const staffIds = (await users.find({ role: { $in: ['TEACHER', 'ADMIN'] } }, { projection: { _id: 1 } }).toArray()).map((u) => String(u._id));
    const withStaff = await classes.find({ studentIds: { $in: staffIds } }, { projection: { code: 1, name: 1 } }).toArray();
    if (!dryRun && withStaff.length) await classes.updateMany({ studentIds: { $in: staffIds } }, { $pull: { studentIds: { $in: staffIds } } });
    say(`2. Rút giảng viên/Admin khỏi danh sách học viên: ${withStaff.length} lớp${withStaff.length ? ` (${withStaff.map((c) => c.code || c.name).join(', ')})` : ''}`);

    // 3. ageGroup chỉ dành cho học viên; student@gmail.com mẫu có khối.
    const staffWithAge = await users.countDocuments({ role: { $ne: 'STUDENT' }, ageGroup: { $exists: true } });
    if (!dryRun && staffWithAge) await users.updateMany({ role: { $ne: 'STUDENT' }, ageGroup: { $exists: true } }, { $unset: { ageGroup: 1 } });
    say(`3a. Bỏ khối học của ${staffWithAge} tài khoản không phải học viên`);
    const demoStudent = await users.findOne({ email: 'student@gmail.com', role: 'STUDENT', ageGroup: { $exists: false } });
    if (demoStudent && !dryRun) await users.updateOne({ _id: demoStudent._id }, { $set: { ageGroup: '10-12' } });
    say(`3b. student@gmail.com: ${demoStudent ? 'gán khối 10-12' : 'đã có khối (hoặc không tồn tại)'}`);

    // 4. PII trẻ 3-5.
    const kidFilter = { role: 'STUDENT', ageGroup: '3-5', $or: [{ phone: { $exists: true } }, { bio: { $exists: true } }] };
    const kids = await users.countDocuments(kidFilter);
    if (!dryRun && kids) await users.updateMany(kidFilter, { $unset: { phone: 1, bio: 1 } });
    say(`4. Bỏ phone/bio của ${kids} tài khoản Lớp 3-5`);

    // 5. Bài chỉ có bankBand.
    const bankOnlyLabel = await exercises
      .find({ resource_id: { $exists: false }, bankBand: { $in: ['6-9', '10-12'] }, targetGroup: { $exists: false }, gradeBand: { $exists: false } }, { projection: { slug: 1, bankBand: 1 } })
      .toArray();
    for (const e of bankOnlyLabel) {
      const set = e.bankBand === '6-9' ? { targetGroup: 'K6_9', labType: 'PYTHON_CODE', gradeBand: '6-9' } : { targetGroup: 'K10_12', labType: 'ALGO_JUDGE', gradeBand: '9-12' };
      if (!dryRun) await exercises.updateOne({ _id: e._id }, { $set: set });
    }
    say(`5. Gắn nhãn khối cho ${bankOnlyLabel.length} bài chỉ có bankBand${bankOnlyLabel.length ? ` (${bankOnlyLabel.map((e) => e.slug).join(', ')})` : ''}`);

    // 6. Bài giảng thiếu status.
    const noStatus = await lessons.find({ status: { $exists: false } }, { projection: { title: 1 } }).toArray();
    if (!dryRun && noStatus.length) await lessons.updateMany({ status: { $exists: false } }, { $set: { status: 'draft' } });
    say(`6. Đặt status 'draft' cho ${noStatus.length} bài giảng thiếu trạng thái`);

    // 7. TTL index.
    if (!dryRun) {
      await db.collection('coach_messages').createIndex({ createdAt: 1 }, { expireAfterSeconds: COACH_TTL_SECONDS });
      await db.collection('revoked_tokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await db.collection('revoked_tokens').createIndex({ jti: 1 }, { unique: true });
    }
    say('7. TTL index: coach_messages (90 ngày), revoked_tokens (theo hạn token)');
    console.log(dryRun ? 'Xong dry-run (chưa ghi gì).' : 'Xong.');
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
