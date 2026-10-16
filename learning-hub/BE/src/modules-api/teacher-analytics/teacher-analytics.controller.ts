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
import { TeacherAnalyticsService } from './teacher-analytics.service';

/**
 * Teacher Dashboard: giảng viên chỉ xem số liệu và giao bài cho lớp được Admin phân công
 * (service lọc theo teacherId === người gọi). Tạo/sửa/xóa lớp và quản lý học viên là việc của
 * `AdminClassesController`; học viên nhận 403 ở mọi route này.
 */
@Controller('teacher/classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class TeacherAnalyticsController {
  constructor(private readonly service: TeacherAnalyticsService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.service.listClasses(user, includeArchived === 'true');
  }

  // Khai báo trước các route có :classId để "catalog" không bị hiểu là id lớp.
  @Get('catalog/exercises')
  catalogExercises(@Query('q') q?: string) {
    return this.service.catalogExercises(q);
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
