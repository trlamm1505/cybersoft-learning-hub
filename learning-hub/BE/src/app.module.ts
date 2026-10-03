import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  AppThrottlerGuard,
  DEFAULT_RATE_LIMIT,
} from './common/security/app-throttler.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules-system/database/database.module';
import { QuizModule } from './modules-api/quiz/quiz.module';
import { ExerciseModule } from './modules-api/exercise/exercise.module';
import { JudgeModule } from './modules-api/judge/judge.module';
import { HintModule } from './modules-api/hint/hint.module';
import { AuthoringModule } from './modules-api/authoring/authoring.module';
import { ContestModule } from './modules-api/contest/contest.module';
import { AuthModule } from './modules-api/auth/auth.module';
import { LeaderboardModule } from './modules-api/leaderboard/leaderboard.module';
import { CoachModule } from './modules-api/coach/coach.module';
import { BlockPuzzleModule } from './modules-api/block-puzzle/block-puzzle.module';
import { ProblemGeneratorModule } from './modules-api/problem-generator/problem-generator.module';
import { RecommendationModule } from './modules-api/recommendation/recommendation.module';
import { TesterLabsModule } from './modules-api/tester-labs/tester-labs.module';
import { DaLabsModule } from './modules-api/da-labs/da-labs.module';
import { AiLabsModule } from './modules-api/ai-labs/ai-labs.module';

@Module({
  imports: [
    // Rate limit toàn cục (theo user nếu có JWT, theo IP nếu chưa đăng nhập).
    ThrottlerModule.forRoot([DEFAULT_RATE_LIMIT]),
    DatabaseModule,
    QuizModule,
    ExerciseModule,
    JudgeModule,
    HintModule,
    AuthoringModule,
    ContestModule,
    AuthModule,
    LeaderboardModule,
    CoachModule,
    BlockPuzzleModule,
    ProblemGeneratorModule,
    RecommendationModule,
    TesterLabsModule,
    DaLabsModule,
    AiLabsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AppThrottlerGuard }],
})
export class AppModule {}
