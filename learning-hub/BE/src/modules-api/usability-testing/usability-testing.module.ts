import { Module } from '@nestjs/common';
import { UsabilityTestingController } from './usability-testing.controller';
import { UsabilityTestingService } from './usability-testing.service';
import { CommonAuthModule } from '../../common/auth/common-auth.module';

@Module({
  imports: [CommonAuthModule],
  controllers: [UsabilityTestingController],
  providers: [UsabilityTestingService],
  exports: [UsabilityTestingService],
})
export class UsabilityTestingModule {}
