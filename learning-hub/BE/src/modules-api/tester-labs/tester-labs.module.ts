import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { TesterLabsController } from './tester-labs.controller';
import { TesterLabsService } from './tester-labs.service';
import { ArtifactUploadService } from './artifact-upload.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [TesterLabsController],
  providers: [TesterLabsService, ArtifactUploadService],
})
export class TesterLabsModule {}
