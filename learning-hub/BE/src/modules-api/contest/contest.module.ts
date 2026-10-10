import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { ContestController } from './contest.controller';
import { ContestService } from './contest.service';
import { ContestSubmissionService } from './contest-submission.service';
import { ContestAttemptService } from './contest-attempt.service';
import { ContestManageService } from './contest-manage.service';
import { ContestProblemContentService } from './contest-problem-content.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [ContestController],
  providers: [
    ContestService,
    ContestSubmissionService,
    ContestAttemptService,
    ContestManageService,
    ContestProblemContentService,
  ],
  exports: [ContestService, ContestSubmissionService, ContestAttemptService],
})
export class ContestModule {}
