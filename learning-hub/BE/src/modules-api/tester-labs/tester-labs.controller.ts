import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { MAX_ARTIFACT_BYTES } from './artifact-upload.service';
import type { UploadedArtifact } from './artifact-upload.service';
import { Throttle } from '@nestjs/throttler';
import { TeacherPiiScrubInterceptor } from '../../common/security/pii-scrub.interceptor';
import { RATE_LIMITS } from '../../common/security/app-throttler.guard';
import { TesterLabsService } from './tester-labs.service';
import type { ReviewInput } from './tester-labs.service';

@Controller('tester-labs')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TeacherPiiScrubInterceptor)
export class TesterLabsController {
  constructor(private readonly service: TesterLabsService) {}

  @Get()
  listLabs() {
    return this.service.listLabs();
  }

  /** Vai trò hiện tại được làm gì (đọc/chấm bài của người khác); luôn 200, không bao giờ 403. */
  @Get('capabilities')
  async capabilities(@CurrentUser() user: JwtPayload) {
    return { ...this.service.capabilities(user), canReviewTesterQueue: await this.service.canSeeReviewQueue(user) };
  }

  /** Hàng chờ chấm Tester QA của giảng viên (đặt trước ':labCode' để không bị nuốt route). */
  @Get('review-queue')
  reviewQueue(@CurrentUser() user: JwtPayload) {
    return this.service.reviewQueue(user);
  }

  @Get(':labCode')
  getLab(@Param('labCode') labCode: string) {
    return this.service.getLab(labCode);
  }

  @Get(':labCode/files/:name')
  async downloadAsset(
    @Param('labCode') labCode: string,
    @Param('name') name: string,
    @Res() res: Response,
  ) {
    res.download(await this.service.getAssetPath(labCode, name), name);
  }

  @Post(':labCode/submissions')
  @Roles('STUDENT')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_ARTIFACT_BYTES } }),
  )
  submit(
    @Param('labCode') labCode: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: UploadedArtifact,
  ) {
    return this.service.submit(labCode, user.sub, file);
  }

  /** Nộp bằng biểu mẫu test case + bug report (JSON); chờ giảng viên chấm, kèm nhận xét sơ bộ ngay. */
  @Post(':labCode/form-submissions')
  @Roles('STUDENT')
  submitForm(
    @Param('labCode') labCode: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: unknown,
  ) {
    return this.service.submitForm(labCode, user.sub, body);
  }

  @Get(':labCode/submissions/mine')
  listMine(
    @Param('labCode') labCode: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.listMine(labCode, user.sub);
  }

  @Get(':labCode/submissions')
  listReviewable(
    @Param('labCode') labCode: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.listReviewable(labCode, user);
  }

  @Get('submissions/:id/artifact')
  async downloadArtifact(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    res.download(await this.service.getArtifactPath(id, user));
  }

  @Put('submissions/:id/review')
  @Throttle(RATE_LIMITS.labReview)
  review(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: ReviewInput,
  ) {
    return this.service.review(id, user, body);
  }

  @Put('submissions/:id/finalize')
  @Throttle(RATE_LIMITS.labReview)
  finalize(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.finalize(id, user);
  }

  @Post('submissions/:id/review-request')
  @Throttle(RATE_LIMITS.labReview)
  requestReopen(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: { reason?: unknown }) {
    return this.service.requestReopen(id, user, body?.reason);
  }

  @Put('submissions/:id/reopen')
  reopen(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.reopen(id, user);
  }
}
