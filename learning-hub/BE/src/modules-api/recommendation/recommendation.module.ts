import { Module } from '@nestjs/common';
import { SystemConfigService } from '../admin-portal/system-config.service';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { RecommendationController } from './recommendation.controller';
import { MasteryService } from './mastery.service';
import { RecommendationService } from './recommendation.service';
import { GeminiLearnerAdvisor, LEARNER_ADVISOR } from './learner-advisor';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [RecommendationController],
  providers: [
    MasteryService,
    RecommendationService,
    {
      provide: LEARNER_ADVISOR,
      inject: [SystemConfigService],
      // null: chỉ dùng lời khuyên theo luật khi chưa có khóa Gemini.
      useFactory: async (sys: SystemConfigService) => {
        await sys.ensureLoaded();
        return sys.currentGeminiKey() ? new GeminiLearnerAdvisor(sys.currentGeminiKey) : null;
      },
    },
  ],
})
export class RecommendationModule {}
