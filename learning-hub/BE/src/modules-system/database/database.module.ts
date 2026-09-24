import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Question, QuestionSchema } from './schemas/question.schema';
import { QuizAttempt, QuizAttemptSchema } from './schemas/quiz-attempt.schema';
import { Exercise, ExerciseSchema } from './schemas/exercise.schema';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import { Hint, HintSchema } from './schemas/hint.schema';
import { HintUsage, HintUsageSchema } from './schemas/hint-usage.schema';
import { Lesson, LessonSchema } from './schemas/lesson.schema';
import { Contest, ContestSchema } from './schemas/contest.schema';
import {
  ContestSubmission,
  ContestSubmissionSchema,
} from './schemas/contest-submission.schema';
import { User, UserSchema } from './schemas/user.schema';
import {
  CoachMessage,
  CoachMessageSchema,
} from './schemas/coach-message.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';
import {
  PasswordReset,
  PasswordResetSchema,
} from './schemas/password-reset.schema';
import {
  BlockPuzzleProgress,
  BlockPuzzleProgressSchema,
} from './schemas/block-puzzle-progress.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('DATABASE_URL') ||
          'mongodb://localhost:27017/cybersoft',
      }),
    }),
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: QuizAttempt.name, schema: QuizAttemptSchema },
      { name: Exercise.name, schema: ExerciseSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Hint.name, schema: HintSchema },
      { name: HintUsage.name, schema: HintUsageSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: Contest.name, schema: ContestSchema },
      { name: ContestSubmission.name, schema: ContestSubmissionSchema },
      { name: User.name, schema: UserSchema },
      { name: CoachMessage.name, schema: CoachMessageSchema },
      { name: Counter.name, schema: CounterSchema },
      { name: PasswordReset.name, schema: PasswordResetSchema },
      { name: BlockPuzzleProgress.name, schema: BlockPuzzleProgressSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
