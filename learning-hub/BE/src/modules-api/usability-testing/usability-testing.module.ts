import { Module } from '@nestjs/common';
import { UsabilityTestingController } from './usability-testing.controller';
import { UsabilityTestingService } from './usability-testing.service';

@Module({
  controllers: [UsabilityTestingController],
  providers: [UsabilityTestingService],
  exports: [UsabilityTestingService],
})
export class UsabilityTestingModule {}
