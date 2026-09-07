import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { JudgeQueueService } from './judge-queue.service';
import { JudgeController } from './judge.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [JudgeController],
  providers: [JudgeQueueService],
  exports: [JudgeQueueService],
})
export class JudgeModule {}
