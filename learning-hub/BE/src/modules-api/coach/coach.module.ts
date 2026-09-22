import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { CoachContextBuilder } from './coach-context.builder';
import { StubLlmClient } from './coach-llm.client';
import { COACH_LLM_CLIENT } from './coach.constants';

@Module({
  imports: [DatabaseModule],
  controllers: [CoachController],
  providers: [
    CoachService,
    CoachContextBuilder,
    {
      provide: COACH_LLM_CLIENT,
      useClass: StubLlmClient,
    },
  ],
  exports: [CoachService],
})
export class CoachModule {}
