import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { RecommendationController } from './recommendation.controller';
import { MasteryService } from './mastery.service';
import { RecommendationService } from './recommendation.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [RecommendationController],
  providers: [MasteryService, RecommendationService],
})
export class RecommendationModule {}
