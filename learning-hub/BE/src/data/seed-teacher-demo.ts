import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { ClassroomSchema } from '../modules-system/database/schemas/classroom.schema';
import { ExerciseSchema } from '../modules-system/database/schemas/exercise.schema';
import { HintUsageSchema } from '../modules-system/database/schemas/hint-usage.schema';
import { SubmissionSchema } from '../modules-system/database/schemas/submission.schema';
import { UserSchema } from '../modules-system/database/schemas/user.schema';
import {
  DEMO_EXERCISES,
  DEMO_HINTS,
  DEMO_OTHER_EXERCISE,
  DEMO_OUTSIDER,
  DEMO_STUDENTS,
  DEMO_SUBMISSIONS,
} from '../modules-api/teacher-analytics/demo-dataset';

dotenv.config();

const MONGO_URI =
  process.env.DATABASE_URL || 'mongodb://localhost:27017/cybersoft';
const TEACHER_EMAIL = process.env.DEMO_TEACHER_EMAIL || 'teacher@gmail.com';
const CLASS_NAME = 'Lớp Demo Dashboard';
const EMAIL = (id: string) => `demo.dashboard.${id}@example.com`;
const SLUG = (slug: string) => `demo-dash-${slug}`;

/**
 * Nạp lớp mẫu cho Teacher Dashboard từ bộ dữ liệu của demo-dataset.ts, nên số liệu hiện trên
 * giao diện phải bằng DEMO_EXPECTED (đối soát bằng test). Chỉ xóa và tạo lại đúng dữ liệu mang
 * tiền tố demo (người dùng demo.dashboard.*, bài demo-dash-*, lớp "Lớp Demo Dashboard").
 * Lớp được giao cho TEACHER_EMAIL (mặc định teacher@gmail.com, tài khoản của seed chính).
 *
 *   npm run seed:teacher-demo
 */
async function seedTeacherDemo() {
  await mongoose.connect(MONGO_URI);
  const User = mongoose.model('User', UserSchema);
  const Exercise = mongoose.model('Exercise', ExerciseSchema);
  const Submission = mongoose.model('Submission', SubmissionSchema);
  const HintUsage = mongoose.model('HintUsage', HintUsageSchema);
  const Classroom = mongoose.model('Classroom', ClassroomSchema);

  const teacher = await User.findOne({ email: TEACHER_EMAIL }).lean();
  if (!teacher) {
    throw new Error(
      `Không có giảng viên ${TEACHER_EMAIL}. Chạy \`npm run seed\` trước hoặc đặt DEMO_TEACHER_EMAIL.`,
    );
  }

  // Dọn dữ liệu demo cũ (kèm bài nộp và gợi ý của chúng).
  const oldUsers = await User.find({ email: /^demo\.dashboard\./ })
    .select('_id')
    .lean();
  const oldExercises = await Exercise.find({ slug: /^demo-dash-/ })
    .select('_id')
    .lean();
  await Submission.deleteMany({
    $or: [
      { userId: { $in: oldUsers.map((u) => String(u._id)) } },
      { exerciseId: { $in: oldExercises.map((e) => String(e._id)) } },
    ],
  });
  await HintUsage.deleteMany({ exerciseSlug: /^demo-dash-/ });
  await Exercise.deleteMany({ slug: /^demo-dash-/ });
  await User.deleteMany({ email: /^demo\.dashboard\./ });
  await Classroom.deleteMany({ name: CLASS_NAME });

  const userId = new Map<string, string>();
  for (const s of [...DEMO_STUDENTS, DEMO_OUTSIDER]) {
    const u = await User.create({
      email: EMAIL(s.id),
      // Không phải bcrypt hash hợp lệ nên các tài khoản demo không đăng nhập được.
      password: '!demo-khong-dang-nhap',
      fullName: s.name,
      role: 'STUDENT',
    });
    userId.set(s.id, String(u._id));
  }

  const exerciseId = new Map<string, string>();
  for (const e of [...DEMO_EXERCISES, DEMO_OTHER_EXERCISE]) {
    const doc = await Exercise.create({
      title: e.title,
      slug: SLUG(e.slug),
      description: `Bài mẫu cho Teacher Dashboard (${e.title}).`,
      type: 'CODE_TEXT',
      difficulty: e.difficulty,
      tags: e.tags,
      topic: (e as { topic?: string }).topic,
    });
    exerciseId.set(e.slug, String(doc._id));
  }

  await Submission.insertMany(
    DEMO_SUBMISSIONS.map((s) => ({
      exerciseId: exerciseId.get(s.exerciseSlug)!,
      userId: userId.get(s.userId)!,
      code: '# bài nộp mẫu',
      status: s.status,
      passedCount: s.status === 'AC' ? 1 : 0,
      totalCount: 1,
      createdAt: s.at,
      updatedAt: s.at,
    })),
    { timestamps: false } as never,
  );
  await HintUsage.insertMany(
    DEMO_HINTS.map((h) => ({
      userId: userId.get(h.userId)!,
      exerciseSlug: SLUG(h.exerciseSlug),
      hintId: new mongoose.Types.ObjectId(),
      level: 1,
    })),
  );

  await Classroom.create({
    name: CLASS_NAME,
    teacherId: String(teacher._id),
    studentIds: DEMO_STUDENTS.map((s) => userId.get(s.id)!),
    exerciseSlugs: DEMO_EXERCISES.map((e) => SLUG(e.slug)),
  });

  console.log(
    `Đã nạp "${CLASS_NAME}" cho ${TEACHER_EMAIL}: ${DEMO_STUDENTS.length} học viên, ${DEMO_EXERCISES.length} bài, ${DEMO_SUBMISSIONS.length} bài nộp, ${DEMO_HINTS.length} gợi ý.`,
  );
  await mongoose.disconnect();
}

seedTeacherDemo().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
