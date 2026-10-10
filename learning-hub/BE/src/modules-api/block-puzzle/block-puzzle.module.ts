import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { BlockPuzzleController } from './block-puzzle.controller';
import { BlockPuzzleService } from './block-puzzle.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [BlockPuzzleController],
  providers: [BlockPuzzleService],
  exports: [BlockPuzzleService],
})
export class BlockPuzzleModule {}
