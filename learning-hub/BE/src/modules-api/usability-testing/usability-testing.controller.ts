import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UsabilityTestingService } from './usability-testing.service';
import { SubmitUsabilityFeedbackDto } from './dto/submit-usability-feedback.dto';

@Controller('usability')
export class UsabilityTestingController {
  constructor(private readonly usabilityService: UsabilityTestingService) {}

  @Get('report')
  async getReport() {
    return this.usabilityService.getUsabilityReport();
  }

  @Post('session')
  async submitSession(@Body() dto: SubmitUsabilityFeedbackDto) {
    return this.usabilityService.recordUsabilitySession(dto);
  }

  @Get('top-fixes')
  getTopFixes() {
    return this.usabilityService.getTopPrioritizedFixes();
  }
}
