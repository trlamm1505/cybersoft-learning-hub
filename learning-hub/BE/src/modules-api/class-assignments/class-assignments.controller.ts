import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { ClassAssignmentsService } from './class-assignments.service';
import { CareerCoursesService } from '../career-courses/career-courses.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

/** Trang "Lớp học của tôi": danh tính luôn lấy từ token, chỉ thành viên của lớp mới xem được (lớp khác trả 404). */
@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class StudentClassAssignmentsController {
  constructor(
    private readonly service: ClassAssignmentsService,
    private readonly careerCourses: CareerCoursesService,
  ) {}

  /** Lớp/khóa học đã tham gia + trạng thái + dữ liệu chứng chỉ khi hoàn thành (trang Hồ sơ). */
  @Get('enrollments')
  enrollments(@CurrentUser() user: JwtPayload) {
    // Người đi làm / Trái ngành học theo khóa chuyên ngành (3 phòng lab), không có lớp phổ thông: trả 3 khóa kèm tiến độ/chứng chỉ.
    if (user.ageGroup === 'CAREER_ADULT') return this.careerCourses.myEnrollments(user.sub);
    return this.service.myEnrollments(user);
  }

  /** Thông tin lớp, giảng viên, tiến độ chung và bài giao nhóm theo ngày. */
  @Get('classes/:classId/overview')
  overview(@Param('classId') classId: string, @CurrentUser() user: JwtPayload) {
    return this.service.overview(classId, user);
  }

  /** Bảng xếp hạng thành viên trong lớp theo tổng điểm. */
  @Get('classes/:classId/leaderboard')
  leaderboard(@Param('classId') classId: string, @CurrentUser() user: JwtPayload) {
    return this.service.leaderboard(classId, user);
  }

  /** Một bài được giao (hạn chót, điểm, khóa) dành cho banner khi làm bài. */
  @Get('assignments/:id')
  assignment(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.myAssignment(id, user);
  }
}

/** Giảng viên giao/xem/xóa bài của lớp mình phụ trách (admin quản lý được mọi lớp). */
@Controller('teacher/class-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class TeacherClassAssignmentsController {
  constructor(private readonly service: ClassAssignmentsService) {}

  /** Ngân hàng đề phân trang (đặt trước ':classId' để "catalog" không bị hiểu là id lớp). */
  @Get('catalog/exercises')
  catalogExercises(@CurrentUser() user: JwtPayload, @Query('q') q?: string, @Query('difficulty') difficulty?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('band') band?: string) {
    return this.service.catalogExercises(user, { q, difficulty, page, pageSize, band });
  }

  @Get('catalog/questions')
  catalogQuestions(@CurrentUser() user: JwtPayload, @Query('q') q?: string, @Query('difficulty') difficulty?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('band') band?: string) {
    return this.service.catalogQuestions(user, { q, difficulty, page, pageSize, band });
  }

  /** Bài của lớp theo Ngày 1, 2, 3... (cùng cấu trúc học viên thấy). */
  @Get(':classId/days')
  days(@Param('classId') classId: string, @CurrentUser() user: JwtPayload) {
    return this.service.daysForTeacher(classId, user);
  }

  @Get(':classId')
  list(@Param('classId') classId: string, @CurrentUser() user: JwtPayload) {
    return this.service.listForTeacher(classId, user);
  }

  @Post(':classId')
  create(@Param('classId') classId: string, @Body() dto: CreateAssignmentDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(classId, dto, user);
  }

  @Delete(':classId/:assignmentId')
  remove(@Param('classId') classId: string, @Param('assignmentId') assignmentId: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(classId, assignmentId, user);
  }
}
