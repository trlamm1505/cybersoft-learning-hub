import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import type { ReviewPolicyType } from './dto/review-attempt.dto';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  /**
   * 1. API Bắt đầu làm bài trắc nghiệm (Start Attempt)
   * Route: POST /api/quiz/start
   */
  @Post('start')
  async startAttempt(@Body() dto: StartAttemptDto) {
    return this.quizService.startAttempt(dto);
  }

  /**
   * 2. API Nộp bài trắc nghiệm & Chấm điểm tự động (Submit Attempt)
   * Route: POST /api/quiz/:attemptId/submit
   */
  @Post(':attemptId/submit')
  async submitAttempt(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.quizService.submitAttempt(attemptId, dto);
  }

  /**
   * 3. API Xem lại bài thi & Giải thích chi tiết theo Review Policy (Review Attempt)
   * Route: GET /api/quiz/:attemptId/review?userId=...&policy=...
   */
  @Get(':attemptId/review')
  async reviewAttempt(
    @Param('attemptId') attemptId: string,
    @Query('userId') userId: string,
    @Query('policy') policy?: string,
  ) {
    return this.quizService.reviewAttempt(attemptId, userId, policy as ReviewPolicyType);
  }
}
