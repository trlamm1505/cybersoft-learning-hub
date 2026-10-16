import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { ClassroomSchema } from '../modules-system/database/schemas/classroom.schema';
import { ExerciseSchema } from '../modules-system/database/schemas/exercise.schema';
import { HintUsageSchema } from '../modules-system/database/schemas/hint-usage.schema';
import { SubmissionSchema } from '../modules-system/database/schemas/submission.schema';
import { UserSchema } from '../modules-system/database/schemas/user.schema';
import { DaLabSubmissionSchema } from '../modules-system/database/schemas/da-lab-submission.schema';
import { AiLabSubmissionSchema } from '../modules-system/database/schemas/ai-lab-submission.schema';
import { cleanupDemo } from '../modules-api/teacher-analytics/demo-cleanup';

dotenv.config();

const MONGO_URI =
  process.env.DATABASE_URL || 'mongodb://localhost:27017/cybersoft';

/**
 * Xóa dữ liệu demo của Teacher Dashboard ("Lớp Demo Dashboard", tài khoản demo.dashboard.*, bài
 * demo-dash-* và bài nộp/gợi ý của chúng). Tài khoản và bài nộp thật không bị ảnh hưởng.
 *
 *   npm run cleanup:teacher-demo               xóa
 *   npm run cleanup:teacher-demo -- --dry-run  chỉ đếm, không xóa gì
 */
async function main() {
  const dryRun = process.argv.includes('--dry-run');
  await mongoose.connect(MONGO_URI);
  const report = await cleanupDemo(
    {
      users: mongoose.model('User', UserSchema),
      exercises: mongoose.model('Exercise', ExerciseSchema),
      submissions: mongoose.model('Submission', SubmissionSchema),
      hints: mongoose.model('HintUsage', HintUsageSchema),
      daLabs: mongoose.model('DaLabSubmission', DaLabSubmissionSchema),
      aiLabs: mongoose.model('AiLabSubmission', AiLabSubmissionSchema),
      classes: mongoose.model('Classroom', ClassroomSchema),
    } as never,
    { dryRun },
  );
  console.log(
    `${dryRun ? '[dry-run] Sẽ xóa' : 'Đã xóa'}: ${report.classes} lớp, ${report.users} tài khoản demo, ${report.exercises} bài demo, ${report.submissions} bài nộp, ${report.hintUsages} lượt gợi ý, ${report.labSubmissions} bài nộp lab.`,
  );
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
