#!/usr/bin/env node
/**
 * Phân loại các bài code HIỆN CÓ vào khối của Ngân hàng đề (6-9 hoặc 10-12) để GV lọc theo khối ra đúng bài, không còn bài "chưa phân loại".
 *
 *   node scripts/classify-existing-exercises.js [--dry-run]
 *
 * Nguyên tắc bất di bất dịch: kho Code Playground giữ nguyên 100%. Script chỉ ĐỌC metadata (slug, tiêu đề, tag, topic, gradeBand, targetGroup,
 * độ khó) và chỉ BỔ SUNG đúng một trường mới `bankBand` ('6-9' | '10-12') cho bài chưa có; không sửa/xóa trường nào khác, không đổi
 * targetGroup/gradeBand (hai trường này quyết định học viên nào thấy bài trong Playground nên không được đụng). Idempotent: bài đã có bankBand
 * bị bỏ qua, chạy lại lần hai không đổi gì. Gỡ nhãn: --remove (chỉ xóa bankBand do script này gắn, đánh dấu bankBandSource).
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/setup-helpers');
const { classifyExercise } = require('./lib/exercise-classifier');

const BE = path.join(__dirname, '..', 'BE');
const SOURCE = 'classify-existing-exercises';

/** Phân loại toàn bộ bài code (CODE_TEXT, không phải bài dataset). Trả về thống kê. */
async function classifyAll(db, { dryRun = false, log = () => {} } = {}) {
  const col = db.collection('exercises');
  const docs = await col
    .find({ type: 'CODE_TEXT', resource_id: { $exists: false } })
    .project({ slug: 1, title: 1, topic: 1, tags: 1, difficulty: 1, gradeBand: 1, targetGroup: 1, bankBand: 1 })
    .toArray();
  const stats = { total: docs.length, alreadyTagged: 0, tagged: 0, byBand: { '6-9': 0, '10-12': 0 }, unclassified: 0 };
  for (const ex of docs) {
    const r = classifyExercise(ex);
    if (!r.changed) {
      stats.alreadyTagged++;
      stats.byBand[r.band]++;
      continue;
    }
    log(`  ${ex.slug} -> ${r.band} (${r.reason})`);
    if (!dryRun) await col.updateOne({ _id: ex._id, bankBand: { $exists: false } }, { $set: { bankBand: r.band, bankBandSource: SOURCE } });
    stats.tagged++;
    stats.byBand[r.band]++;
  }
  if (!dryRun) {
    stats.unclassified = await col.countDocuments({ type: 'CODE_TEXT', resource_id: { $exists: false }, bankBand: { $exists: false } });
  }
  return stats;
}

async function removeTags(db) {
  const r = await db.collection('exercises').updateMany({ bankBandSource: SOURCE }, { $unset: { bankBand: '', bankBandSource: '' } });
  return r.modifiedCount;
}

module.exports = { classifyAll, removeTags };

if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');
  const remove = process.argv.includes('--remove');
  const envText = fs.existsSync(path.join(BE, '.env')) ? fs.readFileSync(path.join(BE, '.env'), 'utf8') : '';
  const uri = process.env.DATABASE_URL || h.readEnvValue(envText, 'DATABASE_URL');
  (async () => {
    const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    const db = mongoose.connection.db;
    try {
      if (remove) return console.log(`Đã gỡ nhãn khối của ${await removeTags(db)} bài.`);
      const s = await classifyAll(db, { dryRun, log: console.log });
      console.log(`${dryRun ? '[dry-run] ' : ''}${s.total} bài code: ${s.alreadyTagged} đã có khối, gắn mới ${s.tagged}; Khối 6–9: ${s.byBand['6-9']}, Khối 10–12: ${s.byBand['10-12']}${dryRun ? '' : `; chưa phân loại: ${s.unclassified}`}.`);
    } finally {
      await mongoose.disconnect();
    }
  })().catch((e) => {
    console.error('Lỗi:', e.message);
    process.exit(1);
  });
}
