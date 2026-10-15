#!/usr/bin/env node
/**
 * Gắn khối lớp (gradeBands) cho các câu trắc nghiệm ôn tập chưa có, theo độ khó:
 *   EASY -> ['6-9'];  MEDIUM -> ['6-9','10-12'];  HARD -> ['10-12']
 *   node scripts/backfill-question-grades.js --dry-run   # chỉ đếm
 *   node scripts/backfill-question-grades.js             # ghi
 * Chỉ cập nhật câu CHƯA có gradeBands (idempotent), không xóa gì.
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/setup-helpers');

const BE = path.join(__dirname, '..', 'BE');
const envText = fs.existsSync(path.join(BE, '.env')) ? fs.readFileSync(path.join(BE, '.env'), 'utf8') : '';
const uri = process.env.DATABASE_URL || h.readEnvValue(envText, 'DATABASE_URL') || '';
const dryRun = process.argv.includes('--dry-run');
const BANDS = { EASY: ['6-9'], MEDIUM: ['6-9', '10-12'], HARD: ['10-12'] };

(async () => {
  if (!uri) { console.error('Thiếu DATABASE_URL.'); process.exit(1); }
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  console.log(`CSDL: ${uri.replace(/(:\/\/[^:/@]+:)[^@]*@/, '$1***@')}${dryRun ? '  [dry-run]' : ''}`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    const col = mongoose.connection.db.collection('questions');
    let total = 0;
    for (const [difficulty, bands] of Object.entries(BANDS)) {
      const filter = { difficulty, gradeBands: { $exists: false } };
      const n = await col.countDocuments(filter);
      total += n;
      if (!dryRun && n) await col.updateMany(filter, { $set: { gradeBands: bands } });
      console.log(`  ${difficulty.padEnd(6)} ${n} câu -> ${bands.join(', ')}`);
    }
    const left = await col.countDocuments({ gradeBands: { $exists: false } });
    console.log(`${dryRun ? 'Sẽ gắn' : 'Đã gắn'} ${total} câu. Còn ${left} câu chưa có khối (độ khó khác) sẽ hiện cho mọi khối.`);
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
