import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ResilienceSecurityService } from './resilience-security.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';

@Controller('resilience')
export class ResilienceSecurityController {
  constructor(private readonly resilienceService: ResilienceSecurityService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.resilienceService.getOperationalDashboard();
  }

  @Post('run-load-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async runLoadTest(@Body('concurrentRequests') requests?: number) {
    return this.resilienceService.runLoadTest(requests || 100);
  }

  @Post('test-worker-restart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async testWorkerRestart() {
    return this.resilienceService.simulateWorkerRestart();
  }

  @Get('limits')
  getLimits() {
    return this.resilienceService.getKnownLimits();
  }
}
