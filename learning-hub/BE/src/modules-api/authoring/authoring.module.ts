import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { AuthoringController } from './authoring.controller';
import { AuthoringService } from './authoring.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthoringController],
  providers: [AuthoringService],
  exports: [AuthoringService],
})
export class AuthoringModule {}
