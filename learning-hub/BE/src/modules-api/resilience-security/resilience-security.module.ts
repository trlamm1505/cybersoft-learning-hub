import { Module } from '@nestjs/common';
import { ResilienceSecurityController } from './resilience-security.controller';
import { ResilienceSecurityService } from './resilience-security.service';

@Module({
  controllers: [ResilienceSecurityController],
  providers: [ResilienceSecurityService],
  exports: [ResilienceSecurityService],
})
export class ResilienceSecurityModule {}
