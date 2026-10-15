import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
      inject: [ConfigService],
      // null: chỉ dùng lời khuyên theo luật khi chưa có GEMINI_API_KEY.
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('GEMINI_API_KEY');
        return apiKey ? new GeminiLearnerAdvisor(apiKey) : null;
      },
    },
  ],
})
export class RecommendationModule {}
