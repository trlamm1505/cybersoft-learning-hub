import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { PROMPT_PROVIDER } from '../../common/prompt-provider';
import { DaLabsModule } from '../da-labs/da-labs.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { AdminPortalController } from './admin-portal.controller';
import { AdminPortalService } from './admin-portal.service';
import { AuditLogService } from './audit-log.service';
import { SystemConfigService } from './system-config.service';

/**
 * Admin Portal v2. Toàn cục (@Global) để các dịch vụ AI nhận prompt/khóa Gemini do Admin cấu hình và các module quản trị
 * ghi được nhật ký hoạt động mà không phải import chéo.
 */
@Global()
@Module({
  imports: [DatabaseModule, CommonAuthModule, DaLabsModule, LeaderboardModule],
  controllers: [AdminPortalController],
  providers: [AdminPortalService, AuditLogService, SystemConfigService, { provide: PROMPT_PROVIDER, useExisting: SystemConfigService }],
  exports: [AuditLogService, SystemConfigService, PROMPT_PROVIDER],
})
export class AdminPortalModule {}
