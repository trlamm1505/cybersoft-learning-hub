import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TeacherPiiScrubInterceptor } from '../../common/security/pii-scrub.interceptor';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS } from '../../common/security/app-throttler.guard';
import { TeacherAnalyticsService } from './teacher-analytics.service';

/**
 * Teacher Dashboard: giảng viên chỉ xem số liệu và giao bài cho lớp được Admin phân công
 * (service lọc theo teacherId === người gọi). Tạo/sửa/xóa lớp và quản lý học viên là việc của
 * `AdminClassesController`; học viên nhận 403 ở mọi route này.
 */
@Controller('teacher/classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
@UseInterceptors(TeacherPiiScrubInterceptor)
export class TeacherAnalyticsController {
  constructor(private readonly service: TeacherAnalyticsService) {}

  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const data = await this.service.listClasses(user, includeArchived === 'true');
    return { success: true, data };
  }

  // Khai báo trước các route có :classId để "catalog" không bị hiểu là id lớp.
  @Get('catalog/exercises')
  catalogExercises(@Query('q') q?: string) {
    return this.service.catalogExercises(q);
  }

  @Post(':classId/invalidate')
  @HttpCode(200)
  @Throttle(RATE_LIMITS.invalidate)
  invalidate(
    @CurrentUser() user: JwtPayload,
    @Param('classId') classId: string,
    @Body() body: { submissionId?: unknown; reason?: unknown },
  ) {
    return this.service.invalidateSubmission(user, classId, body);
  }

  @Get(':classId')
  detail(@CurrentUser() user: JwtPayload, @Param('classId') classId: string) {
    return this.service.getClassDetail(user, classId);
  }

  @Put(':classId/exercises')
  setExercises(
    @CurrentUser() user: JwtPayload,
    @Param('classId') classId: string,
    @Body() body: { slugs?: unknown },
  ) {
    return this.service.setExercises(user, classId, body?.slugs);
  }

  @Get(':classId/analytics')
  overview(@CurrentUser() user: JwtPayload, @Param('classId') classId: string) {
    return this.service.getOverview(user, classId);
  }

  @Get(':classId/students/:studentId')
  student(
    @CurrentUser() user: JwtPayload,
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getStudent(user, classId, studentId);
  }

  @Get(':classId/exercises/:slug')
  exercise(
    @CurrentUser() user: JwtPayload,
    @Param('classId') classId: string,
    @Param('slug') slug: string,
  ) {
    return this.service.getExercise(user, classId, slug);
  }
}
