import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { HintController } from './hint.controller';
import { HintService } from './hint.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [HintController],
  providers: [HintService],
  exports: [HintService],
})
export class HintModule {}
