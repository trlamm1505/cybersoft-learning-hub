import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { QuestionBankController } from './question-bank.controller';
import { QuestionBankService } from './question-bank.service';
import { QuizBankController } from './quiz-bank.controller';
import { QuizBankService } from './quiz-bank.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  // QuizBankController đứng trước: route /teacher/question-bank/questions phải khớp trước /teacher/question-bank/:slug.
  controllers: [QuizBankController, QuestionBankController],
  providers: [QuestionBankService, QuizBankService],
})
export class QuestionBankModule {}
