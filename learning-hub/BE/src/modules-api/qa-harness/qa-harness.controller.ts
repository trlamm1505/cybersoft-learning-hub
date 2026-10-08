import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { QaHarnessService } from './qa-harness.service';
import { EvaluateGateDto } from './dto/evaluate-gate.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';

@Controller('qa')
export class QaHarnessController {
  constructor(private readonly qaHarnessService: QaHarnessService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.qaHarnessService.getQualityDashboard();
  }

  @Post('evaluate-gate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async evaluateGate(@Body() dto: EvaluateGateDto) {
    return this.qaHarnessService.evaluateQualityGate(dto);
  }

  @Post('run-smoke-tests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async runSmokeTests() {
    return this.qaHarnessService.runSmokeTests();
  }

  @Post('run-ai-regression')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async runAiRegression() {
    return this.qaHarnessService.runAiRegression();
  }
}
