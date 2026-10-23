#!/usr/bin/env node
/**
 * Gán nhóm mặc định cho bài Python cũ chưa phân lớp để học viên lớp 6-9 thấy lại:
 *   node scripts/backfill-legacy-exercises.js --dry-run   # chỉ liệt kê
 *   node scripts/backfill-legacy-exercises.js             # ghi: gradeBand=6-9, targetGroup=K6_9, labType=PYTHON_CODE
 * Cùng quy tắc với ExerciseService.assignLegacyGrade (nút "Gán nhóm cho bài cũ" của Admin):
 * chỉ bài CODE_TEXT chưa có gradeBand/targetGroup/labType, bỏ bài demo (demo-dash-ex-*).
 * Idempotent, không xóa gì.
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/setup-helpers');

const BE = path.join(__dirname, '..', 'BE');
const envText = fs.existsSync(path.join(BE, '.env')) ? fs.readFileSync(path.join(BE, '.env'), 'utf8') : '';
const uri = process.env.DATABASE_URL || h.readEnvValue(envText, 'DATABASE_URL') || '';
const dryRun = process.argv.includes('--dry-run');

(async () => {
  if (!uri) { console.error('Thiếu DATABASE_URL.'); process.exit(1); }
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  console.log(`CSDL: ${uri.replace(/(:\/\/[^:/@]+:)[^@]*@/, '$1***@')}${dryRun ? '  [dry-run]' : ''}`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    const col = mongoose.connection.db.collection('exercises');
    const filter = {
      resource_id: { $exists: false }, type: 'CODE_TEXT',
      gradeBand: { $exists: false }, targetGroup: { $exists: false }, labType: { $exists: false },
      slug: { $not: /^demo-dash-ex-/ },
    };
    const found = await col.find(filter, { projection: { slug: 1 } }).toArray();
    found.forEach((e) => console.log(`  ${dryRun ? 'sẽ gán' : 'gán'}  ${e.slug}`));
    if (!dryRun && found.length) {
      const r = await col.updateMany(filter, { $set: { gradeBand: '6-9', targetGroup: 'K6_9', labType: 'PYTHON_CODE' } });
      console.log(`Đã cập nhật ${r.modifiedCount}/${found.length} bài.`);
    } else {
      console.log(`${found.length} bài khớp.`);
    }
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
