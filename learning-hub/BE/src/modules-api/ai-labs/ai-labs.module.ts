import { Module } from '@nestjs/common';
import { SystemConfigService } from '../admin-portal/system-config.service';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { DatasetIntegrationModule } from '../../integration/dataset-integration.module';
import {
  AiLabsController,
  TeacherAiLabSubmissionsController,
} from './ai-labs.controller';
import { AiLabsService } from './ai-labs.service';
import { AiLabAuthoringController, AiLabAuthoringService } from './ai-lab-authoring.service';
import { AiLabGraderService } from './ai-lab-grader.service';
import { AI_LAB_LIVE_LLM, GeminiAiLabLiveLlm } from './ai-lab-live-run';

@Module({
  imports: [DatabaseModule, CommonAuthModule, DatasetIntegrationModule],
  controllers: [AiLabsController, TeacherAiLabSubmissionsController, AiLabAuthoringController],
  providers: [
    AiLabsService,
    AiLabAuthoringService,
    AiLabGraderService,
    {
      provide: AI_LAB_LIVE_LLM,
      inject: [SystemConfigService],
      // null: chưa có khóa Gemini thì chỉ chấm bằng bộ mô phỏng như trước.
      useFactory: async (sys: SystemConfigService) => {
        await sys.ensureLoaded();
        return sys.currentGeminiKey() ? new GeminiAiLabLiveLlm(sys.currentGeminiKey) : null;
      },
    },
  ],
})
export class AiLabsModule {}
