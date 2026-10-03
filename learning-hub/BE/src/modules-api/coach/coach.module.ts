import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { CoachContextBuilder } from './coach-context.builder';
import { StubLlmClient } from './coach-llm.client';
import { GeminiCoachLlmClient } from './coach-gemini.client';
import { COACH_LLM_CLIENT } from './coach.constants';
import {
  COACH_DEBUG_EXPLAINER,
  GeminiDebugExplainer,
} from './coach-debug-explainer';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [CoachController],
  providers: [
    CoachService,
    CoachContextBuilder,
    {
      provide: COACH_LLM_CLIENT,
      inject: [ConfigService],
      // Có GEMINI_API_KEY thì gọi Gemini thật, không có thì dùng Stub như trước.
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('GEMINI_API_KEY');
        return apiKey ? new GeminiCoachLlmClient(apiKey) : new StubLlmClient();
      },
    },
    {
      provide: COACH_DEBUG_EXPLAINER,
      inject: [ConfigService],
      // null: CoachService bỏ qua bước Gemini, giữ phân tích rule-based.
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('GEMINI_API_KEY');
        return apiKey ? new GeminiDebugExplainer(apiKey) : null;
      },
    },
  ],
  exports: [CoachService],
})
export class CoachModule {}
