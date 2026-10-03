import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { DaLabsService } from './da-labs.service';
import type { TeacherReviewInput } from './da-labs.service';

@Controller('da-labs')
@UseGuards(JwtAuthGuard)
export class DaLabsController {
  constructor(private readonly service: DaLabsService) {}

  @Get()
  listLabs() {
    return this.service.listLabs();
  }

  /** Bài nộp Insight mới nhất của học viên đang đăng nhập; null nếu chưa nộp. */
  @Get('exercises/:exerciseId/my-submission')
  getMySubmission(
    @Param('exerciseId') exerciseId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getMySubmission(exerciseId, user.sub);
  }

  @Get(':slug')
  getLab(@Param('slug') slug: string) {
    return this.service.getLab(slug);
  }

  @Get(':slug/dataset')
  getLabDataset(@Param('slug') slug: string) {
    return this.service.getLabDataset(slug);
  }

  @Post(':slug/run')
  run(@Param('slug') slug: string, @Body() body: { sql?: string }) {
    return this.service.runSql(slug, body?.sql ?? '');
  }

  @Post(':slug/submit')
  submit(@Param('slug') slug: string, @Body() body: { sql?: string }) {
    return this.service.submitSql(slug, body?.sql ?? '');
  }

  @Post(':slug/insight')
  submitInsight(
    @Param('slug') slug: string,
    @Body() body: { answer?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.submitInsight(slug, body?.answer ?? '', user.sub);
  }
}

/** API cho Teacher Dashboard: hàng chờ chấm tay bài Insight. */
@Controller('teacher/submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class TeacherSubmissionsController {
  constructor(private readonly service: DaLabsService) {}

  @Get('pending')
  listPending() {
    return this.service.listPendingReviews();
  }

  @Put(':id/review')
  review(
    @Param('id') id: string,
    @Body() body: TeacherReviewInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.reviewSubmission(id, body, user.sub);
  }
}
