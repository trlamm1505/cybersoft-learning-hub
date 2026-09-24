import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { AuthoringController } from './authoring.controller';
import { AuthoringService } from './authoring.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [AuthoringController],
  providers: [AuthoringService],
  exports: [AuthoringService],
})
export class AuthoringModule {}
