import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { IntegrityController } from './integrity.controller';
import { IntegrityService } from './integrity.service';
import { ProctorController } from './proctor.controller';
import { ProctorService } from './proctor.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [IntegrityController, ProctorController],
  providers: [IntegrityService, ProctorService],
  exports: [IntegrityService, ProctorService],
})
export class IntegrityModule {}
