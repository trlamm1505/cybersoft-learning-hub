import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { TeacherAnalyticsService } from './teacher-analytics.service';

/**
 * Lớp học của chính học viên đang đăng nhập (danh tính lấy từ token, không nhận id từ client).
 * Giảng viên và quản trị viên có route riêng nên nhận 403 ở đây.
 */
@Controller('student/classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class StudentClassesController {
  constructor(private readonly service: TeacherAnalyticsService) {}

  @Get()
  mine(@CurrentUser() user: JwtPayload) {
    return this.service.listMyClasses(user);
  }
}
