import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { IntegrityService } from './integrity.service';
import type { IntegrityReviewInput } from './integrity.service';

/** Hàng chờ xem xét tính trung thực: chỉ giảng viên/quản trị viên, học viên nhận 403. */
@Controller('teacher/integrity')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class IntegrityController {
  constructor(private readonly service: IntegrityService) {}

  @Get('queue')
  queue(@Query('status') status?: string) {
    return this.service.listQueue(status);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.getDetail(id);
  }

  @Put(':id/review')
  review(
    @Param('id') id: string,
    @Body() body: IntegrityReviewInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.review(id, body, user.sub);
  }
}
