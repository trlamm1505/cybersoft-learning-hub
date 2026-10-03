import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { DatasetIntegrationModule } from '../../integration/dataset-integration.module';
import {
  AiLabsController,
  TeacherAiLabSubmissionsController,
} from './ai-labs.controller';
import { AiLabsService } from './ai-labs.service';
import { AiLabGraderService } from './ai-lab-grader.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule, DatasetIntegrationModule],
  controllers: [AiLabsController, TeacherAiLabSubmissionsController],
  providers: [AiLabsService, AiLabGraderService],
})
export class AiLabsModule {}
