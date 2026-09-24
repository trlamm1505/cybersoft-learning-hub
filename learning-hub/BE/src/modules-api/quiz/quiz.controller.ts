import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import type { ReviewPolicyType } from './dto/review-attempt.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  /**
   * 1. API Bắt đầu làm bài trắc nghiệm (Start Attempt)
   * Route: POST /api/quiz/start
   * userId lấy từ Bearer token (không còn nhận từ body) — trước đây client
   * tự khai userId nào cũng được, có thể tạo attempt thay mặt người khác.
   */
  @Post('start')
  async startAttempt(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartAttemptDto,
  ) {
    return this.quizService.startAttempt(user.sub, dto);
  }

  /**
   * 2. API Nộp bài trắc nghiệm & Chấm điểm tự động (Submit Attempt)
   * Route: POST /api/quiz/:attemptId/submit
   */
  @Post(':attemptId/submit')
  async submitAttempt(
    @CurrentUser() user: JwtPayload,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.quizService.submitAttempt(attemptId, user.sub, dto);
  }

  /**
   * 3. API Xem lại bài thi & Giải thích chi tiết theo Review Policy (Review Attempt)
   * Route: GET /api/quiz/:attemptId/review?policy=...
   * userId lấy từ token thay vì query string — trước đây bất kỳ ai đoán được
   * attemptId + userId của người khác đều xem được bài làm/đáp án của họ.
   */
  @Get(':attemptId/review')
  async reviewAttempt(
    @CurrentUser() user: JwtPayload,
    @Param('attemptId') attemptId: string,
    @Query('policy') policy?: string,
  ) {
    return this.quizService.reviewAttempt(
      attemptId,
      user.sub,
      policy as ReviewPolicyType,
    );
  }
}
