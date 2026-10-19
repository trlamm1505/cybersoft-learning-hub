#!/usr/bin/env node
/**
 * Seed vài bé "mẫu" đã phá đảo các game Block Puzzle để Bảng Vinh Danh không bị trống (dùng khi demo).
 *   node scripts/seed-kid-leaderboard.js --dry-run   # chỉ in kế hoạch
 *   node scripts/seed-kid-leaderboard.js             # ghi vào CSDL trong BE/.env
 *   node scripts/seed-kid-leaderboard.js --remove    # xóa đúng các bé mẫu này và tiến độ của họ
 *
 * Xếp hạng theo THỜI GIAN CHƠI (từ màn đầu tới màn cuối; ngày phá đảo chỉ là tiêu chí phụ), nên ngày phá đảo của các bé mẫu luôn nằm trong
 * QUÁ KHỨ (mặc định 6 ngày trước tới hôm qua; chỉnh bằng SEED_FIRST_DAY=YYYY-MM-DD): Bảng Vinh Danh không bao giờ hiện ngày tương lai.
 * Các bé mẫu có email @demo.cybersoft.local (không đăng nhập được: mật khẩu ngẫu nhiên) và cờ
 * isSeedDemo=true; chạy lại không tạo trùng (upsert), --remove chỉ đụng đúng các bản ghi đó.
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
// Ngày bắt đầu của dãy mốc phá đảo: 6 ngày trước (dayOffset 0..5 => 6 ngày trước ... hôm qua), luôn là quá khứ.
const FIRST_DAY = process.env.SEED_FIRST_DAY || new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

// Khớp BE/src/modules-api/block-puzzle/block-puzzle-games.ts
const lv = (id, n) => Array.from({ length: n }, (_, i) => `${id}-level-${i + 1}`);
const BUILTIN = {
  'blockly-maze': lv('blockly-maze', 10),
  'blockly-turtle': lv('blockly-turtle', 10),
  'blockly-bird': lv('blockly-bird', 10),
  'blockly-puzzle': ['blockly-puzzle'],
};

const KIDS = [
  { email: 'seed-kid-1@demo.cybersoft.local', fullName: 'Nguyễn Minh Khôi', dayOffset: 0, hour: 9 },
  { email: 'seed-kid-2@demo.cybersoft.local', fullName: 'Trần Bảo Ngọc', dayOffset: 0, hour: 20 },
  { email: 'seed-kid-3@demo.cybersoft.local', fullName: 'Lê Gia Hân', dayOffset: 1, hour: 15 },
  { email: 'seed-kid-4@demo.cybersoft.local', fullName: 'Phạm Đức Anh', dayOffset: 2, hour: 10 },
  { email: 'seed-kid-5@demo.cybersoft.local', fullName: 'Võ Thảo Vy', dayOffset: 3, hour: 18 },
  { email: 'seed-kid-6@demo.cybersoft.local', fullName: 'Đặng Hoàng Long', dayOffset: 3, hour: 21 },
  { email: 'seed-kid-7@demo.cybersoft.local', fullName: 'Bùi Khánh Chi', dayOffset: 4, hour: 9 },
  { email: 'seed-kid-8@demo.cybersoft.local', fullName: 'Ngô Quốc Bảo', dayOffset: 4, hour: 16 },
  { email: 'seed-kid-9@demo.cybersoft.local', fullName: 'Lý Mai Phương', dayOffset: 5, hour: 10 },
  { email: 'seed-kid-10@demo.cybersoft.local', fullName: 'Hồ Minh Triết', dayOffset: 5, hour: 19 },
];

// Xếp hạng theo TỔNG THỜI GIAN chơi (ngắn hơn = hạng cao hơn). Tổng thời gian của bé thứ k ở mỗi game là
//   MIN_TOTAL_MIN[game] + k * 5 + ngẫu nhiên(0..4) phút   (bé 1 nhanh nhất, bé 5 chậm nhất)
// nên thứ hạng giữa các bé mẫu luôn là 1,2,3,4,5. MIN_TOTAL_MIN đặt NGƯỠNG CHẬM NHẤT của bé nhanh nhất:
// Mê Cung = 43 phút, tức mọi bé mẫu đều chậm hơn mốc 41,5 phút của bé thật (Dương Chí Việt) và bé thật đứng hạng 1.
// Chỉnh bằng SEED_MIN_TOTAL_JSON='{"blockly-maze":50}'. Các màn trong một game chia tổng thời gian đó theo tỉ lệ ngẫu nhiên
// (mỗi khoảng luôn >> ngưỡng chống gian lận 10 giây). Hạt giống theo (bé, game) nên chạy lại ra đúng cùng số (idempotent).
const MIN_TOTAL_MIN = Object.assign(
  { 'blockly-maze': 43, 'blockly-turtle': 30, 'blockly-bird': 30, 'robot-ve-nha': 45 },
  JSON.parse(process.env.SEED_MIN_TOTAL_JSON || '{}'),
);
const DEFAULT_MIN_TOTAL_MIN = 30;
const JITTER_MIN = 90; // giờ xong mỗi game lệch ngẫu nhiên +-90 phút quanh mốc của bé (không ảnh hưởng thứ hạng vì xếp theo thời lượng)

function rng(seedStr) {
  let a = crypto.createHash('sha256').update(seedStr).digest().readUInt32LE(0);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

(async () => {
  if (!uri) { console.error('Thiếu DATABASE_URL.'); process.exit(1); }
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const bcrypt = require(path.join(BE, 'node_modules', 'bcrypt'));
  console.log(`CSDL: ${uri.replace(/(:\/\/[^:/@]+:)[^@]*@/, '$1***@')}${dryRun ? '  [dry-run]' : ''}${remove ? '  [remove]' : ''}`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    const db = mongoose.connection.db;
    const users = db.collection('users');
    const progress = db.collection('block_puzzle_progress');

    if (remove) {
      const seeded = await users.find({ isSeedDemo: true }, { projection: { _id: 1 } }).toArray();
      const ids = seeded.map((u) => String(u._id));
      if (!dryRun) {
        const p = await progress.deleteMany({ userId: { $in: ids } });
        const u = await users.deleteMany({ isSeedDemo: true });
        console.log(`Đã xóa ${u.deletedCount} bé mẫu và ${p.deletedCount} bản ghi tiến độ.`);
      } else console.log(`Sẽ xóa ${ids.length} bé mẫu và tiến độ của họ.`);
      return;
    }

    // Game của giảng viên (vd Robot Về Nhà): lấy các màn đã đăng từ CSDL.
    const lessons = await db.collection('lessons')
      .find({ type: 'block' }, { projection: { slug: 1, status: 1, blockPuzzle: 1 } }).toArray();
    const games = { ...BUILTIN };
    for (const l of lessons.sort((a, b) => (a.blockPuzzle?.order ?? 0) - (b.blockPuzzle?.order ?? 0))) {
      if (!(l.status === 'published' || !l.status) || !l.blockPuzzle) continue;
      const id = l.blockPuzzle.gameId || 'robot-ve-nha';
      if (BUILTIN[id]) continue;
      (games[id] = games[id] || []).push(l.slug);
    }
    console.log('Game:', Object.entries(games).map(([id, s]) => `${id}(${s.length})`).join(', '));

    const pwHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
    const base = new Date(`${FIRST_DAY}T00:00:00`);
    let docs = 0;
    for (const kid of KIDS) {
      const finish = new Date(base.getTime() + kid.dayOffset * 86400000);
      finish.setHours(kid.hour, 0, 0, 0);
      console.log(`  ${kid.fullName.padEnd(20)} phá đảo mọi game lúc ${finish.toLocaleString('vi-VN')}`);
      if (dryRun) { docs += Object.values(games).reduce((n, s) => n + s.length, 0); continue; }


      const res = await users.findOneAndUpdate(
        { email: kid.email },
        {
          $set: { fullName: kid.fullName, role: 'STUDENT', ageGroup: '3-5', status: 'ACTIVE', isSeedDemo: true, updatedAt: new Date() },
          $setOnInsert: { email: kid.email, password: pwHash, createdAt: new Date() },
        },
        { upsert: true, returnDocument: 'after' },
      );
      const userId = String(res._id);
      for (const [gameId, slugs] of Object.entries(games)) {
        const rand = rng(`${kid.email}|${gameId}`);
        const k = KIDS.indexOf(kid);
        const totalMs = Math.round(((MIN_TOTAL_MIN[gameId] ?? DEFAULT_MIN_TOTAL_MIN) + k * 5 + rand() * 4) * 60000);
        // Màn cuối ở mốc `finish` (lệch ngẫu nhiên); các màn trước lùi dần, tổng đúng bằng totalMs.
        const weights = Array.from({ length: Math.max(0, slugs.length - 1) }, () => 0.5 + rand());
        const wsum = weights.reduce((a, b) => a + b, 0) || 1;
        let t = finish.getTime() + Math.round((rand() * 2 - 1) * JITTER_MIN * 60000);
        const times = new Array(slugs.length);
        times[slugs.length - 1] = t;
        for (let i = slugs.length - 2; i >= 0; i--) {
          t -= Math.round((totalMs * weights[i]) / wsum);
          times[i] = t;
        }
        const mins = ((times[slugs.length - 1] - times[0]) / 60000).toFixed(1);
        console.log(`      ${gameId.padEnd(16)} ${slugs.length} màn, tổng ${mins} phút`);
        for (let i = 0; i < slugs.length; i++) {
          const at = new Date(times[i]);
          await progress.updateOne(
            { userId, lessonSlug: slugs[i] },
            { $set: { gameId, completedAt: at, updatedAt: new Date() }, $setOnInsert: { userId, lessonSlug: slugs[i], createdAt: new Date() } },
            { upsert: true },
          );
          docs++;
        }
      }
    }
    console.log(dryRun ? `Sẽ ghi ${docs} bản ghi tiến độ cho ${KIDS.length} bé.` : `Xong: ${KIDS.length} bé, ${docs} bản ghi tiến độ.`);
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
