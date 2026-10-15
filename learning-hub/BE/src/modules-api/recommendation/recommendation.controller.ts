import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS } from '../../common/security/app-throttler.guard';
import { MasteryService } from './mastery.service';
import { RecommendationService } from './recommendation.service';

@Controller('learner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class RecommendationController {
  constructor(
    private readonly masteryService: MasteryService,
    private readonly recommendationService: RecommendationService,
  ) {}

  /**
   * GET /api/learner/progress
   * Mastery theo tag của chính học viên đang đăng nhập (userId lấy từ JWT,
   * không nhận từ query/param — tránh học viên xem tiến độ của người khác).
   */
  @Get('progress')
  async getProgress(@CurrentUser() user: JwtPayload) {
    return this.recommendationService.getProgress(user.sub);
  }

  /**
   * GET /api/learner/stats
   * Thống kê lượt nộp (AC/WA/TLE/RE/CE) và tỷ lệ hoàn thành theo chủ đề của chính học viên đang đăng nhập.
   */
  @Get('stats')
  async getStats(@CurrentUser() user: JwtPayload) {
    return this.recommendationService.getStats(user.sub, user.ageGroup);
  }

  /**
   * GET /api/learner/ai-advice
   * Gemini phân tích lịch sử làm bài của chính học viên: chủ đề hay sai nhất + 1-2 bài nên làm tiếp (kèm lý do).
   * Giới hạn tần suất vì mỗi lần là một lượt gọi model.
   */
  @Get('ai-advice')
  @Throttle(RATE_LIMITS.coachChat)
  async getAiAdvice(@CurrentUser() user: JwtPayload) {
    return this.recommendationService.getAiAdvice(user.sub, user.ageGroup);
  }

  /**
   * GET /api/learner/recommendations
   * Tối đa 3 gợi ý: remediation, progression, exploration — luôn kèm `reason`
   * để học viên biết vì sao được gợi ý, và không ép đi theo một đường duy nhất.
   */
  @Get('recommendations')
  async getRecommendations(@CurrentUser() user: JwtPayload) {
    const recommendations = await this.recommendationService.getRecommendations(
      user.sub,
    );
    return { recommendations };
  }
}
