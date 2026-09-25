import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { OptionalJwtAuthGuard } from '../../common/auth/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

@Controller('contests')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  /**
   * GET /api/contests/:id/leaderboard?asTeacher=true — route CÔNG KHAI (thí
   * sinh xem bảng xếp hạng không cần đăng nhập), nhưng `asTeacher=true` (bỏ
   * qua "freeze" bảng xếp hạng trong lúc thi) chỉ có hiệu lực khi người gọi
   * đã đăng nhập với role TEACHER thật. Trước đây bất kỳ ai cũng tự thêm
   * `?asTeacher=true` vào URL để xem điểm real-time, phá vỡ tính công bằng
   * của cơ chế đóng băng bảng xếp hạng.
   */
  @Get(':id/leaderboard')
  @UseGuards(OptionalJwtAuthGuard)
  async getLeaderboard(
    @Param('id') id: string,
    @Query('asTeacher') asTeacher: string | undefined,
    @CurrentUser() user?: JwtPayload,
  ) {
    const isAuthenticatedTeacher = user?.role === 'TEACHER';
    return this.leaderboardService.computeLeaderboard(id, {
      asTeacher: asTeacher === 'true' && isAuthenticatedTeacher,
    });
  }

  @Get(':id/leaderboard/rules')
  async getRules(@Param('id') id: string) {
    return this.leaderboardService.getRules(id);
  }
}
