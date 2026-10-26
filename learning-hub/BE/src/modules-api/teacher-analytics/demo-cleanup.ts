/**
 * Dọn dữ liệu demo của Teacher Dashboard (bộ trong demo-dataset.ts, nạp bằng `npm run seed:teacher-demo`).
 * Chỉ động tới dữ liệu mang dấu hiệu demo: người dùng `demo.dashboard.*`, bài `demo-dash-*`, lớp
 * "Lớp Demo Dashboard" (hoặc lớp chỉ giao bài demo). Tài khoản, lớp và bài nộp thật không bị đụng tới.
 */
export const DEMO_EMAIL = /^demo\.dashboard\./;
export const DEMO_SLUG = /^demo-dash-/;
export const DEMO_CLASS_NAME = 'Lớp Demo Dashboard';

interface Model {
  find: (filter: object) => {
    select: (fields: string) => {
      lean: () => Promise<Array<Record<string, any>>>;
    };
  };
  deleteMany: (filter: object) => Promise<{ deletedCount?: number }>;
  countDocuments: (filter: object) => Promise<number>;
  updateMany?: (filter: object, update: object) => Promise<unknown>;
}

export interface CleanupModels {
  users: Model;
  exercises: Model;
  submissions: Model;
  hints: Model;
  daLabs: Model;
  aiLabs: Model;
  classes: Model;
}

export interface CleanupReport {
  dryRun: boolean;
  users: number;
  exercises: number;
  classes: number;
  submissions: number;
  hintUsages: number;
  labSubmissions: number;
}

export async function cleanupDemo(
  m: CleanupModels,
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<CleanupReport> {
  const demoUsers = await m.users
    .find({ email: DEMO_EMAIL })
    .select('_id')
    .lean();
  const demoExercises = await m.exercises
    .find({ slug: DEMO_SLUG })
    .select('_id')
    .lean();
  const userIds = demoUsers.map((u) => String(u._id));
  const exerciseIds = demoExercises.map((e) => String(e._id));

  const byUser = { userId: { $in: userIds } };
  const submissionFilter = {
    $or: [byUser, { exerciseId: { $in: exerciseIds } }],
  };
  const hintFilter = { $or: [byUser, { exerciseSlug: DEMO_SLUG }] };
  const labFilter = { $or: [byUser, { exerciseSlug: DEMO_SLUG }] };

  const allClasses = await m.classes
    .find({})
    .select('name exerciseSlugs')
    .lean();
  const classIds = allClasses
    .filter((c) => {
      const slugs: string[] = c.exerciseSlugs ?? [];
      return (
        c.name === DEMO_CLASS_NAME ||
        (slugs.length > 0 && slugs.every((s) => DEMO_SLUG.test(s)))
      );
    })
    .map((c) => c._id);

  const report: CleanupReport = {
    dryRun,
    users: userIds.length,
    exercises: exerciseIds.length,
    classes: classIds.length,
    submissions: await m.submissions.countDocuments(submissionFilter),
    hintUsages: await m.hints.countDocuments(hintFilter),
    labSubmissions:
      (await m.daLabs.countDocuments(labFilter)) +
      (await m.aiLabs.countDocuments(labFilter)),
  };
  if (dryRun) return report;

  await m.submissions.deleteMany(submissionFilter);
  await m.hints.deleteMany(hintFilter);
  await m.daLabs.deleteMany(labFilter);
  await m.aiLabs.deleteMany(labFilter);
  if (classIds.length) await m.classes.deleteMany({ _id: { $in: classIds } });
  // Học viên demo lỡ có mặt trong lớp thật thì chỉ gỡ họ ra, không xóa lớp.
  if (userIds.length && m.classes.updateMany) {
    await m.classes.updateMany({}, { $pull: { studentIds: { $in: userIds } } });
  }
  if (exerciseIds.length)
    await m.exercises.deleteMany({ _id: { $in: exerciseIds } });
  if (userIds.length) await m.users.deleteMany({ _id: { $in: userIds } });
  return report;
}
