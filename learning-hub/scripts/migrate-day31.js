#!/usr/bin/env node
/**
 * Migration Day 31: chuẩn hóa tiến độ Code Playground cũ (xem scripts/lib/playground-sequence.js). Idempotent, KHÔNG xóa bài nộp nào.
 *
 *   node scripts/migrate-day31.js --dry-run   # chỉ liệt kê học viên bị ảnh hưởng
 *   node scripts/migrate-day31.js             # gắn cờ outOfSequence cho bài nộp AC luyện tập nhảy cóc
 *   node scripts/migrate-day31.js --revert    # bỏ cờ (trả tiến độ về như cũ)
 *
 * Sau khi chạy, mỗi học viên 6-9 / 10-12 chỉ còn tiến độ liên tục #1..#k: bài #(k+1) đang mở, các bài sau khóa.
 * `npm run seed` cũng tự chạy bước này.
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/setup-helpers');
const { normalizePlaygroundProgress, revertPlaygroundProgress } = require('./lib/playground-sequence');

const BE = path.join(__dirname, '..', 'BE');
const envText = fs.readFileSync(path.join(BE, '.env'), 'utf8');
const uri = process.env.DATABASE_URL || h.readEnvValue(envText, 'DATABASE_URL');
const dryRun = process.argv.includes('--dry-run');
const revert = process.argv.includes('--revert');
const tag = dryRun ? '(dry-run) ' : '';

(async () => {
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    console.log(`Migration Day 31${dryRun ? ' [dry-run]' : ''}${revert ? ' [revert]' : ''}`);
    if (revert) {
      console.log(`  ${tag}Bỏ cờ outOfSequence của ${await revertPlaygroundProgress(mongoose.connection.db, { dryRun })} bài nộp`);
      return;
    }
    const r = await normalizePlaygroundProgress(mongoose.connection.db, { dryRun });
    for (const d of r.details) console.log(`  ${tag}${d.email} (khối ${d.band}): ${d.exercises} bài nhảy cóc, ${d.submissions} bài nộp`);
    console.log(`  ${tag}Tổng: ${r.students} học viên, ${r.flagged} bài nộp được gắn cờ outOfSequence (không tính vào tiến độ lộ trình, vẫn còn trong lịch sử).`);
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
