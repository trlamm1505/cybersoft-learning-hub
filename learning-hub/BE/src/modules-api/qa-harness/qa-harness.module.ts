import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { QaHarnessController } from './qa-harness.controller';
import { QaHarnessService } from './qa-harness.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [QaHarnessController],
  providers: [QaHarnessService],
  exports: [QaHarnessService],
})
export class QaHarnessModule {}
