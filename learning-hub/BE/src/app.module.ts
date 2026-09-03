import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules-system/database/database.module';
import { QuizModule } from './modules-api/quiz/quiz.module';
import { ExerciseModule } from './modules-api/exercise/exercise.module';

@Module({
  imports: [DatabaseModule, QuizModule, ExerciseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
