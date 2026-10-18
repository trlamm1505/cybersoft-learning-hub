/**
 * Chuẩn hóa tiến độ Code Playground cũ (Day 31). Trước đây khóa tuần tự bị TẮT khi danh sách trộn nhiều chủ đề ("Tất cả chủ đề"), nên học viên
 * nộp nhảy cóc được (vd AC bài #3 và #10 khi #1, #2 chưa làm). Từ Day 31 máy chủ chặn nộp nhảy cóc; dữ liệu cũ được chuẩn hóa bằng cách
 * gắn cờ `outOfSequence` cho các bài nộp AC luyện tập nằm SAU chỗ đứt đầu tiên của chuỗi. Không xóa bài nộp nào (còn nguyên trong lịch sử);
 * chỉ không tính vào tiến độ lộ trình. Có thể hoàn tác bằng `--revert`.
 */

/** Khối -> bộ lọc lộ trình chuẩn (cùng định nghĩa với BE/src/modules-api/exercise/playground-catalog.ts). */
const TRACKS = {
  '6-9': { topic: 'python-fundamentals', grades: ['6-9'] },
  '10-12': { topic: 'algorithm-contest-prep', grades: ['9-12', '10-12'] },
};

/** Cùng định nghĩa "hoàn thành ở Playground" với PRACTICE_AC_FILTER của BE. */
const practiceAc = (extra = {}) => ({ status: 'AC', assignmentId: { $exists: false }, outOfSequence: { $ne: true }, ...extra });

/**
 * Bài nào bị coi là nhảy cóc: tất cả bài đã giải đứng sau chỗ đứt đầu tiên của chuỗi #1..#N.
 * @param {string[]} orderedIds id bài theo thứ tự #1..#N
 * @param {Set<string>} solved id bài đã giải (luyện tập)
 * @returns {string[]} id các bài cần gắn cờ
 */
function outOfSequenceIds(orderedIds, solved) {
  const firstGap = orderedIds.findIndex((id) => !solved.has(id));
  if (firstGap < 0) return [];
  return orderedIds.filter((id, i) => i > firstGap && solved.has(id));
}

async function loadTrack(db, band) {
  const t = TRACKS[band];
  const docs = await db
    .collection('exercises')
    .find({
      type: 'CODE_TEXT', topic: t.topic, orderInTopic: { $gte: 1 }, gradeBand: { $in: t.grades },
      bankOnly: { $ne: true }, resource_id: { $exists: false }, tags: { $nin: ['sql', 'da-lab', 'ai-lab', 'tester-lab'] },
    })
    .sort({ orderInTopic: 1, slug: 1 })
    .project({ slug: 1 })
    .toArray();
  return docs.map((d) => String(d._id));
}

/**
 * Gắn cờ outOfSequence cho học viên 6-9 / 10-12 có tiến độ nhảy cóc. Idempotent.
 * @returns {{ students: number, flagged: number, details: Array<{ email: string, band: string, exercises: number, submissions: number }> }}
 */
async function normalizePlaygroundProgress(db, { dryRun = false } = {}) {
  const submissions = db.collection('submissions');
  const result = { students: 0, flagged: 0, details: [] };
  for (const band of Object.keys(TRACKS)) {
    const ids = await loadTrack(db, band);
    if (ids.length === 0) continue;
    const students = await db.collection('users').find({ role: 'STUDENT', ageGroup: band }, { projection: { email: 1 } }).toArray();
    for (const s of students) {
      const uid = String(s._id);
      const rows = await submissions.find({ userId: uid, ...practiceAc({ exerciseId: { $in: ids } }) }, { projection: { exerciseId: 1 } }).toArray();
      const bad = new Set(outOfSequenceIds(ids, new Set(rows.map((r) => String(r.exerciseId)))));
      if (bad.size === 0) continue;
      const subs = rows.filter((r) => bad.has(String(r.exerciseId)));
      if (!dryRun) await submissions.updateMany({ _id: { $in: subs.map((r) => r._id) } }, { $set: { outOfSequence: true } });
      result.students += 1;
      result.flagged += subs.length;
      result.details.push({ email: s.email, band, exercises: bad.size, submissions: subs.length });
    }
  }
  return result;
}

/** Hoàn tác: bỏ cờ outOfSequence ở mọi bài nộp. */
async function revertPlaygroundProgress(db, { dryRun = false } = {}) {
  const filter = { outOfSequence: true };
  const n = await db.collection('submissions').countDocuments(filter);
  if (!dryRun && n) await db.collection('submissions').updateMany(filter, { $unset: { outOfSequence: 1 } });
  return n;
}

module.exports = { TRACKS, outOfSequenceIds, normalizePlaygroundProgress, revertPlaygroundProgress };
