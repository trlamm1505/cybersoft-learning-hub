import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { HintController } from './hint.controller';
import { HintService } from './hint.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HintController],
  providers: [HintService],
  exports: [HintService],
})
export class HintModule {}
