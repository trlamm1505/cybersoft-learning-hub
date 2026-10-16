import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS } from '../../common/security/app-throttler.guard';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { StudentOnlyGuard } from '../../common/auth/student-only.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { AiLabsService } from './ai-labs.service';
import type { AiLabRunInput } from './ai-lab-grader.service';
import { NoSecretsPipe } from './secret-guard';

@Controller('ai-labs')
@UseGuards(JwtAuthGuard)
export class AiLabsController {
  constructor(private readonly service: AiLabsService) {}

  @Get()
  listLabs() {
    return this.service.listLabs();
  }

  @Get(':slug')
  getLab(@Param('slug') slug: string) {
    return this.service.getLab(slug);
  }

  @Get(':slug/evaluation-set')
  getEvaluationPreview(@Param('slug') slug: string) {
    return this.service.getEvaluationPreview(slug);
  }

  @Get(':slug/my-submission')
  getMySubmission(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getMySubmission(slug, user.sub);
  }

  /** Payload có chuỗi giống API key bị NoSecretsPipe chặn trước khi chấm hay lưu. */
  @Post(':slug/submit')
  @UseGuards(StudentOnlyGuard)
  @Throttle(RATE_LIMITS.aiLabSubmit)
  submit(
    @Param('slug') slug: string,
    @Body(NoSecretsPipe) body: AiLabRunInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.submit(slug, body ?? {}, user.sub);
  }
}

/** Giảng viên/quản trị viên xem bài AI Lab của học viên. */
@Controller('teacher/ai-lab-submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class TeacherAiLabSubmissionsController {
  constructor(private readonly service: AiLabsService) {}

  @Get()
  list() {
    return this.service.listSubmissionsForStaff();
  }
}
