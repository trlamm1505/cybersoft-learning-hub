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
import { DaLabAuthoringController, DaLabAuthoringService } from './da-lab-authoring.service';
import { SqlGraderService } from './sql-grader.service';
import { InsightGraderService } from './insight-grader.service';
import {
  PgSandboxExecutor,
  SANDBOX_SQL_EXECUTOR,
} from './sandbox-sql.executor';
import { SqliteSandboxExecutor } from './sqlite-sandbox.executor';
import {
  GeminiInsightLlmClient,
  INSIGHT_LLM_CLIENT,
  UnconfiguredInsightLlmClient,
} from './insight-llm.client';

@Module({
  imports: [DatabaseModule, CommonAuthModule, DatasetIntegrationModule],
  controllers: [DaLabsController, TeacherSubmissionsController, DaLabAuthoringController],
  providers: [
    DaLabsService,
    DaLabAuthoringService,
    SqlGraderService,
    InsightGraderService,
    {
      provide: SANDBOX_SQL_EXECUTOR,
      inject: [ConfigService],
      // Mặc định SQLite in-memory trong tiến trình Node (không Docker, chạy được trên Vercel/serverless).
      // Đặt SQL_ENGINE=postgres để dùng lại Postgres Sandbox do TTS 01 cấp.
      useFactory: (config: ConfigService) =>
        config.get<string>('SQL_ENGINE') === 'postgres' ? new PgSandboxExecutor() : new SqliteSandboxExecutor(),
    },
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
