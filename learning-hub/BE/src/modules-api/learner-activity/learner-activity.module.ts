import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { LearnerActivityController } from './learner-activity.controller';
import { LearnerActivityService } from './learner-activity.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [LearnerActivityController],
  providers: [LearnerActivityService],
  exports: [LearnerActivityService],
})
export class LearnerActivityModule {}
