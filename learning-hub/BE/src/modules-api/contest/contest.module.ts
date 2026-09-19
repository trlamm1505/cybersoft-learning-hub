import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { ContestController } from './contest.controller';
import { ContestService } from './contest.service';
import { ContestSubmissionService } from './contest-submission.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ContestController],
  providers: [ContestService, ContestSubmissionService],
  exports: [ContestService, ContestSubmissionService],
})
export class ContestModule {}
