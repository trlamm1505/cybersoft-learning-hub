import { Controller, Get, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { TeacherPiiScrubInterceptor } from '../../common/security/pii-scrub.interceptor';
import { TesterClassService } from './tester-class.service';

/** Giảng viên đọc một bài nộp Tester Lab của học viên (không đụng tới endpoint nộp bài của học viên). */
@Controller('teacher/tester-labs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
@UseInterceptors(TeacherPiiScrubInterceptor)
export class TeacherTesterSubmissionController {
  constructor(private readonly service: TesterClassService) {}

  @Get('submissions/:id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.submissionDetail(user, id);
  }
}

/** Lớp Tester QA: xếp hạng/tiến độ học viên, hồ sơ bài làm và hàng chờ chấm ngay trong lớp. */
@Controller('teacher/classes/:classId/tester')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
@UseInterceptors(TeacherPiiScrubInterceptor)
export class TesterClassController {
  constructor(private readonly service: TesterClassService) {}

  @Get('roster')
  roster(@CurrentUser() user: JwtPayload, @Param('classId') classId: string) {
    return this.service.rosterWithProgress(user, classId);
  }

  @Get('queue')
  queue(@CurrentUser() user: JwtPayload, @Param('classId') classId: string) {
    return this.service.queue(user, classId);
  }

  @Get('students/:studentId')
  student(@CurrentUser() user: JwtPayload, @Param('classId') classId: string, @Param('studentId') studentId: string) {
    return this.service.studentDetail(user, classId, studentId);
  }
}
