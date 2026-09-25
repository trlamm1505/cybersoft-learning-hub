import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
@Controller('block-puzzle/progress')
@UseGuards(JwtAuthGuard)
export class BlockPuzzleController {
  constructor(private readonly blockPuzzleService: BlockPuzzleService) {}

  /**
   * GET /api/block-puzzle/progress
   * Danh sách slug bài đã hoàn thành của CHÍNH tài khoản đang đăng nhập.
   */
  @Get()
  async getProgress(@CurrentUser() user: JwtPayload) {
    const completedSlugs = await this.blockPuzzleService.getCompletedSlugs(user.sub);
    return { completedSlugs };
  }

  /**
   * POST /api/block-puzzle/progress/complete
   * Đánh dấu một bài đã hoàn thành cho CHÍNH tài khoản đang đăng nhập.
   */
  @Post('complete')
  async markCompleted(@CurrentUser() user: JwtPayload, @Body() dto: CompleteLessonDto) {
    return this.blockPuzzleService.markCompleted(user.sub, dto);
  }
}
