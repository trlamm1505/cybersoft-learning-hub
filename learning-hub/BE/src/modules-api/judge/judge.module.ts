import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { JudgeQueueService } from './judge-queue.service';
import { JudgeController } from './judge.controller';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [JudgeController],
  providers: [JudgeQueueService],
  exports: [JudgeQueueService],
})
export class JudgeModule {}
