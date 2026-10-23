import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatasetIntegrationService } from './dataset-integration.service';

@Module({
  imports: [HttpModule],
  providers: [DatasetIntegrationService],
  exports: [DatasetIntegrationService],
})
export class DatasetIntegrationModule {}
