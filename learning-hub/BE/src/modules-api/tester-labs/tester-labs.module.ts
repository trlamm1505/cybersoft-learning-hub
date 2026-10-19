import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { TesterLabsController } from './tester-labs.controller';
import { TesterLabsService } from './tester-labs.service';
import { TesterLabAuthoringController, TesterLabAuthoringService } from './tester-lab-authoring.service';
import { ArtifactUploadService } from './artifact-upload.service';
import { TesterClassService } from './tester-class.service';
import { TesterClassController, TeacherTesterSubmissionController } from './tester-class.controller';
import { AttachmentUploadService } from './attachment-upload.service';
import { AttachmentsController } from './attachments.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, DatabaseModule, CommonAuthModule],
  controllers: [TesterLabsController, TesterLabAuthoringController, AttachmentsController, TesterClassController, TeacherTesterSubmissionController],
  providers: [TesterLabsService, TesterLabAuthoringService, ArtifactUploadService, AttachmentUploadService, TesterClassService],
})
export class TesterLabsModule {}
