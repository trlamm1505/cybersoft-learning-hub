import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { DatasetIntegrationModule } from '../../integration/dataset-integration.module';
import {
  DaLabsController,
  TeacherSubmissionsController,
} from './da-labs.controller';
import { DaLabsService } from './da-labs.service';
import { SqlGraderService } from './sql-grader.service';
import { InsightGraderService } from './insight-grader.service';
import {
  PgSandboxExecutor,
  SANDBOX_SQL_EXECUTOR,
} from './sandbox-sql.executor';
import {
  GeminiInsightLlmClient,
  INSIGHT_LLM_CLIENT,
  UnconfiguredInsightLlmClient,
} from './insight-llm.client';

@Module({
  imports: [DatabaseModule, CommonAuthModule, DatasetIntegrationModule],
  controllers: [DaLabsController, TeacherSubmissionsController],
  providers: [
    DaLabsService,
    SqlGraderService,
    InsightGraderService,
    { provide: SANDBOX_SQL_EXECUTOR, useClass: PgSandboxExecutor },
    {
      provide: INSIGHT_LLM_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('GEMINI_API_KEY');
        return apiKey
          ? new GeminiInsightLlmClient(apiKey)
          : new UnconfiguredInsightLlmClient();
      },
    },
  ],
})
export class DaLabsModule {}
