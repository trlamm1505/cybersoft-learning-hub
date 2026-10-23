import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BlockPuzzleService } from './block-puzzle.service';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

/**
 * Toàn bộ route yêu cầu đăng nhập (JwtAuthGuard) — userId luôn lấy từ token,
 * không nhận từ body/query, để một tài khoản không thể đọc/ghi tiến độ của
 * tài khoản khác chỉ bằng cách đoán/khai userId.
 */
@Controller('block-puzzle')
@UseGuards(JwtAuthGuard)
export class BlockPuzzleController {
  constructor(private readonly blockPuzzleService: BlockPuzzleService) {}

  /** GET /api/block-puzzle/leaderboard/:gameId — Bảng vinh danh của một game. */
  @Get('leaderboard/:gameId')
  async leaderboard(
    @Param('gameId') gameId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.blockPuzzleService.leaderboard(gameId, user.sub);
  }

  /** GET /api/block-puzzle/kids/:userId — thẻ thông tin một bạn đang có tên trên bảng vinh danh. */
  @Get('kids/:userId')
  async kidCard(@Param('userId') userId: string) {
    return this.blockPuzzleService.kidCard(userId);
  }

  /** GET /api/block-puzzle/records — Kỷ lục cá nhân của CHÍNH bé đang đăng nhập. */
  @Get('records')
  async records(@CurrentUser() user: JwtPayload) {
    return { records: await this.blockPuzzleService.records(user.sub) };
  }

  /**
   * GET /api/block-puzzle/progress
   * Danh sách slug bài đã hoàn thành của CHÍNH tài khoản đang đăng nhập.
   */
  @Get('progress')
  async getProgress(@CurrentUser() user: JwtPayload) {
    const completedSlugs = await this.blockPuzzleService.getCompletedSlugs(user.sub);
    return { completedSlugs };
  }

  /**
   * POST /api/block-puzzle/progress/complete
   * Đánh dấu một bài đã hoàn thành cho CHÍNH tài khoản đang đăng nhập.
   */
  @Post('progress/complete')
  async markCompleted(@CurrentUser() user: JwtPayload, @Body() dto: CompleteLessonDto) {
    return this.blockPuzzleService.markCompleted(user.sub, dto);
  }
}
