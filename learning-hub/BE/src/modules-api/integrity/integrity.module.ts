import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { IntegrityController } from './integrity.controller';
import { IntegrityService } from './integrity.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [IntegrityController],
  providers: [IntegrityService],
  exports: [IntegrityService],
})
export class IntegrityModule {}
