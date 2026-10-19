import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { QuizService } from './quiz.service';
import { ClassAssignmentsModule } from '../class-assignments/class-assignments.module';
import { QuizController } from './quiz.controller';

@Module({
  imports: [DatabaseModule, CommonAuthModule, ClassAssignmentsModule],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
