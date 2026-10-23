import { Module } from '@nestjs/common';
import { SystemConfigService } from '../admin-portal/system-config.service';
import { PROMPT_PROVIDER } from '../../common/prompt-provider';
import type { PromptProvider } from '../../common/prompt-provider';
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
      inject: [SystemConfigService],
      // Có khóa Gemini (do Admin lưu hoặc GEMINI_API_KEY) thì gọi Gemini thật, không có thì dùng Stub như trước.
      useFactory: async (sys: SystemConfigService) => {
        await sys.ensureLoaded();
        return sys.currentGeminiKey() ? new GeminiCoachLlmClient(sys.currentGeminiKey) : new StubLlmClient();
      },
    },
    {
      provide: COACH_DEBUG_EXPLAINER,
      inject: [SystemConfigService, PROMPT_PROVIDER],
      // null: CoachService bỏ qua bước Gemini, giữ phân tích rule-based.
      useFactory: async (sys: SystemConfigService, prompts: PromptProvider) => {
        await sys.ensureLoaded();
        return sys.currentGeminiKey() ? new GeminiDebugExplainer(sys.currentGeminiKey, prompts) : null;
      },
    },
  ],
  exports: [CoachService],
})
export class CoachModule {}
