import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { LearnerActivityService } from './learner-activity.service';

@Controller('learner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class LearnerActivityController {
  constructor(private readonly service: LearnerActivityService) {}

  /**
   * GET /api/learner/activity?days=371&tzOffset=420
   * Số lượt nộp bài theo ngày của chính học viên đang đăng nhập (userId lấy từ JWT).
   * `tzOffset` là số phút lệch so với UTC của trình duyệt (UTC+7 → 420) để ngày
   * được chia đúng theo giờ địa phương.
   */
  @Get('activity')
  getActivity(
    @CurrentUser() user: JwtPayload,
    @Query('days') days?: string,
    @Query('tzOffset') tzOffset?: string,
  ) {
    return this.service.getActivity(user.sub, { days, tzOffset });
  }
}
