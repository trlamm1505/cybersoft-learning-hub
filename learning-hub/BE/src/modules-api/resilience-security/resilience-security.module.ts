import { Module } from '@nestjs/common';
import { ResilienceSecurityController } from './resilience-security.controller';
import { ResilienceSecurityService } from './resilience-security.service';
import { CommonAuthModule } from '../../common/auth/common-auth.module';

@Module({
  imports: [CommonAuthModule],
  controllers: [ResilienceSecurityController],
  providers: [ResilienceSecurityService],
  exports: [ResilienceSecurityService],
})
export class ResilienceSecurityModule {}
