import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { DatasetIntegrationModule } from '../../integration/dataset-integration.module';
import {
  AiLabsController,
  TeacherAiLabSubmissionsController,
} from './ai-labs.controller';
import { AiLabsService } from './ai-labs.service';
import { AiLabGraderService } from './ai-lab-grader.service';
import { AI_LAB_LIVE_LLM, GeminiAiLabLiveLlm } from './ai-lab-live-run';

@Module({
  imports: [DatabaseModule, CommonAuthModule, DatasetIntegrationModule],
  controllers: [AiLabsController, TeacherAiLabSubmissionsController],
  providers: [
    AiLabsService,
    AiLabGraderService,
    {
      provide: AI_LAB_LIVE_LLM,
      inject: [ConfigService],
      // null: chưa có GEMINI_API_KEY thì chỉ chấm bằng bộ mô phỏng như trước.
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('GEMINI_API_KEY');
        return apiKey ? new GeminiAiLabLiveLlm(apiKey) : null;
      },
    },
  ],
})
export class AiLabsModule {}
