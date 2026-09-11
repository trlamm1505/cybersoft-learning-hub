import { Module } from '@nestjs/common';
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

@Module({
  imports: [DatabaseModule, QuizModule, ExerciseModule, JudgeModule, HintModule, AuthoringModule, ContestModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
