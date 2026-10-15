import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { CareerCoursesService } from './career-courses.service';

/** Khóa học chuyên ngành của chính học viên (userId từ token): tiến độ, lịch sử nộp và nhận xét theo từng bài lab. */
@Controller('student/career-courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class CareerCoursesController {
  constructor(private readonly service: CareerCoursesService) {}

  @Get()
  mine(@CurrentUser() user: JwtPayload) {
    return this.service.myCourses(user.sub);
  }
}
