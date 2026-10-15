import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { RATE_LIMITS } from '../../common/security/app-throttler.guard';
import { ProctorService } from './proctor.service';

export class LeaveEventDto {
  scope?: string;
  refId?: string;
}

/** Học viên báo "vừa rời màn hình làm bài"; số lần do máy chủ đếm và cảnh báo giảng viên. */
@Controller('proctor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class ProctorController {
  constructor(private readonly service: ProctorService) {}

  @Post('leave')
  @Throttle(RATE_LIMITS.proctorLeave)
  leave(@Body() dto: LeaveEventDto, @CurrentUser() user: JwtPayload) {
    const refId = typeof dto?.refId === 'string' ? dto.refId.slice(0, 100) : '';
    return this.service.recordLeave(String(dto?.scope ?? ''), refId, user);
  }
}
