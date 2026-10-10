import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { getInitialContests, resolveSeedProblems } from './initial-contests';
import { ContestSchema } from '../modules-system/database/schemas/contest.schema';
import { ContestAttemptSchema } from '../modules-system/database/schemas/contest-attempt.schema';
import { ContestSubmissionSchema } from '../modules-system/database/schemas/contest-submission.schema';
import { QuestionSchema } from '../modules-system/database/schemas/question.schema';

dotenv.config();

const MONGO_URI =
  process.env.DATABASE_URL || 'mongodb://localhost:27017/cybersoft';

/**
 * Nạp lại các cuộc thi mẫu với giờ tính theo thời điểm chạy (một cuộc đang
 * diễn ra, một sắp diễn ra, một đã kết thúc, một bản nháp) để thử tay. Chỉ xóa
 * và tạo lại đúng các slug mẫu (kèm bài nộp/lượt thi của chúng); cuộc thi do
 * giảng viên tự tạo không bị đụng tới.
 *
 *   npm run seed:contests
 */
async function seedContests() {
  await mongoose.connect(MONGO_URI);
  const Contest = mongoose.model('Contest', ContestSchema);
  const Attempt = mongoose.model('ContestAttempt', ContestAttemptSchema);
  const Submission = mongoose.model('ContestSubmission', ContestSubmissionSchema);
  const Question = mongoose.model('Question', QuestionSchema);

  const contests = await resolveSeedProblems(
    getInitialContests(),
    async (category, limit) =>
      (await Question.find({ category }).select('_id').limit(limit).lean()).map(
        (q) => String(q._id),
      ),
  );

  for (const c of contests) {
    const old = await Contest.findOne({ slug: c.slug }).select('_id').lean();
    if (old) {
      const contestId = String(old._id);
      await Promise.all([
        Submission.deleteMany({ contestId }),
        Attempt.deleteMany({ contestId }),
        Contest.deleteOne({ _id: old._id }),
      ]);
    }
    await Contest.create(c);
    console.log(`✅ ${c.status.padEnd(9)} ${c.title} (${c.problems.length} đề)`);
  }
  await mongoose.disconnect();
}

seedContests().catch((err) => {
  console.error('❌ Seed contests thất bại:', err);
  process.exit(1);
});
