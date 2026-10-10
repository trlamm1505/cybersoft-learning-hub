import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { DatasetIntegrationModule } from '../../integration/dataset-integration.module';
import { AuthoringController } from './authoring.controller';
import { AuthoringService } from './authoring.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule, DatasetIntegrationModule],
  controllers: [AuthoringController],
  providers: [AuthoringService],
  exports: [AuthoringService],
})
export class AuthoringModule {}

