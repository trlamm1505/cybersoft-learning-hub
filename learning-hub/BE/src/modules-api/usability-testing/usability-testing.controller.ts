import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UsabilityTestingService } from './usability-testing.service';
import { SubmitUsabilityFeedbackDto } from './dto/submit-usability-feedback.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';

@Controller('usability')
export class UsabilityTestingController {
  constructor(private readonly usabilityService: UsabilityTestingService) {}

  // Báo cáo usability nội bộ: chỉ giảng viên/quản trị viên.
  @Get('report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async getReport() {
    return this.usabilityService.getUsabilityReport();
  }

  // Ghi phiên kiểm thử: phải đăng nhập (trước đây khách ẩn danh gửi được, có thể spam bộ nhớ máy chủ).
  @Post('session')
  @UseGuards(JwtAuthGuard)
  async submitSession(@Body() dto: SubmitUsabilityFeedbackDto) {
    return this.usabilityService.recordUsabilitySession(dto);
  }

  @Get('top-fixes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  getTopFixes() {
    return this.usabilityService.getTopPrioritizedFixes();
  }
}
