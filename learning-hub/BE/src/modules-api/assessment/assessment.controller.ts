import { Body, Controller, Get, HttpCode, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { RATE_LIMITS } from '../../common/security/app-throttler.guard';
import { AssessmentService } from './assessment.service';
import { KidProgressService } from './kid-progress.service';
import { CareerLabClassService } from './career-lab-class.service';
import { TeacherPiiScrubInterceptor } from '../../common/security/pii-scrub.interceptor';
import type { AssessmentInput } from './domain/assessment-policy';

/** Giảng viên phụ trách lớp: tạo bài đánh giá, chấm, công bố, xử lý phúc khảo, chốt, hủy; xem điểm tổng kết và tiến độ ải. */
@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class TeacherAssessmentController {
  constructor(
    private readonly service: AssessmentService,
    private readonly kids: KidProgressService,
  ) {}

  @Post('classes/:classId/assessments')
  create(@CurrentUser() user: JwtPayload, @Param('classId') classId: string, @Body() body: AssessmentInput) {
    return this.service.createAssessment(user, classId, body);
  }

  @Get('classes/:classId/assessments')
  list(@CurrentUser() user: JwtPayload, @Param('classId') classId: string) {
    return this.service.listAssessments(user, classId);
  }

  @Get('assessments/:assessmentId/submissions')
  submissions(@CurrentUser() user: JwtPayload, @Param('assessmentId') id: string) {
    return this.service.listSubmissions(user, id);
  }

  @Post('assessment-submissions/:id/start-grading')
  @HttpCode(200)
  startGrading(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.startGrading(user, id);
  }

  @Post('assessment-submissions/:id/grade')
  @HttpCode(200)
  grade(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { rawScore?: unknown; feedback?: unknown; details?: unknown }) {
    return this.service.grade(user, id, body);
  }

  @Post('assessment-submissions/:id/publish')
  @HttpCode(200)
  publish(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.publish(user, id);
  }

  @Post('assessment-submissions/:id/appeal-decision')
  @HttpCode(200)
  resolveAppeal(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { decision?: unknown; note?: unknown }) {
    return this.service.resolveAppeal(user, id, body?.decision, body?.note);
  }

  @Post('assessment-submissions/:id/finalize')
  @HttpCode(200)
  finalize(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.finalize(user, id);
  }

  @Post('assessment-submissions/:id/invalidate')
  @HttpCode(200)
  @Throttle(RATE_LIMITS.invalidate)
  invalidate(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { reason?: unknown }) {
    return this.service.invalidate(user, id, body?.reason);
  }

  @Get('classes/:classId/final-grades')
  classFinalGrades(@CurrentUser() user: JwtPayload, @Param('classId') classId: string) {
    return this.service.calculateClassFinalGrades(user, classId);
  }

  @Get('classes/:classId/final-grades/:studentId')
  finalGrade(@CurrentUser() user: JwtPayload, @Param('classId') classId: string, @Param('studentId') studentId: string) {
    return this.service.calculateFinalGrade(user, classId, studentId);
  }

  @Get('classes/:classId/kid-progress')
  kidProgress(@CurrentUser() user: JwtPayload, @Param('classId') classId: string) {
    return this.kids.listForTeacher(user, classId);
  }
}

/** Lớp Data SQL Lab / AI Prompt Lab: giảng viên chỉ theo dõi (danh sách, tiến độ, điểm, câu SQL / prompt đã nộp). */
@Controller('teacher/classes/:classId/career')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
@UseInterceptors(TeacherPiiScrubInterceptor)
export class CareerLabClassController {
  constructor(private readonly service: CareerLabClassService) {}

  @Get('roster')
  roster(@CurrentUser() user: JwtPayload, @Param('classId') classId: string) {
    return this.service.rosterWithProgress(user, classId);
  }

  @Get('students/:studentId')
  student(@CurrentUser() user: JwtPayload, @Param('classId') classId: string, @Param('studentId') studentId: string) {
    return this.service.studentDetail(user, classId, studentId);
  }
}

/** Học viên: làm bài, nộp, xem kết quả của mình, phúc khảo; báo rời màn hình khi thi. (Tiến độ ải của bé do Block Puzzle ghi, xem /block-puzzle/progress/complete.) */
@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class StudentAssessmentController {
  constructor(private readonly service: AssessmentService) {}

  @Get('classes/:classId/assessments')
  list(@CurrentUser() user: JwtPayload, @Param('classId') classId: string) {
    return this.service.listAssessments(user, classId);
  }

  @Post('assessments/:assessmentId/draft')
  draft(@CurrentUser() user: JwtPayload, @Param('assessmentId') id: string, @Body() body: { content?: unknown }) {
    return this.service.saveDraft(user, id, body?.content);
  }

  @Post('assessment-submissions/:id/submit')
  @HttpCode(200)
  submit(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.submit(user, id);
  }

  @Get('assessment-submissions/:id')
  mine(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.getMine(user, id);
  }

  @Post('assessment-submissions/:id/appeal')
  @HttpCode(200)
  appeal(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { reason?: unknown }) {
    return this.service.appeal(user, id, body?.reason);
  }

  @Post('assessment-submissions/:id/leave')
  @HttpCode(200)
  @Throttle(RATE_LIMITS.proctorLeave)
  leave(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { awayMs?: unknown }) {
    return this.service.recordContestLeave(user, id, body?.awayMs);
  }

  @Get('classes/:classId/final-grade')
  finalGrade(@CurrentUser() user: JwtPayload, @Param('classId') classId: string) {
    return this.service.calculateFinalGrade(user, classId, user.sub);
  }

}
