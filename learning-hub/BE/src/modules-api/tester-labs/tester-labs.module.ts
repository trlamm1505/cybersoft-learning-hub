import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { TesterLabsController } from './tester-labs.controller';
import { TesterLabsService } from './tester-labs.service';
import { TesterLabAuthoringController, TesterLabAuthoringService } from './tester-lab-authoring.service';
import { ArtifactUploadService } from './artifact-upload.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [TesterLabsController, TesterLabAuthoringController],
  providers: [TesterLabsService, TesterLabAuthoringService, ArtifactUploadService],
})
export class TesterLabsModule {}
