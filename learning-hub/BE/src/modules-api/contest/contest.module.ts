import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { ContestController } from './contest.controller';
import { ContestService } from './contest.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ContestController],
  providers: [ContestService],
  exports: [ContestService],
})
export class ContestModule {}
