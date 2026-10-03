import { isStaff } from '../../common/auth/roles';
import { Controller, ForbiddenException, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { HintService } from './hint.service';
import { UnlockHintDto } from './dto/unlock-hint.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/auth/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

@Controller('hints')
export class HintController {
  constructor(private readonly hintService: HintService) {}

  /**
   * GET /api/hints/exercise/:exerciseSlug
   * Lấy danh sách thông tin hints của một bài tập. Xem được không cần đăng nhập
   * (nội dung gợi ý đã mở khóa vẫn ẩn), nhưng trạng thái "đã mở" chỉ tính theo
   * user thật lấy từ token — không còn nhận userId qua query string.
   */
  @Get('exercise/:exerciseSlug')
  @UseGuards(OptionalJwtAuthGuard)
  async getHintsByExercise(
    @Param('exerciseSlug') exerciseSlug: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.hintService.getHintsByExercise(exerciseSlug, user?.sub);
  }

  /**
   * POST /api/hints/unlock
   * Mở một cấp độ gợi ý (1, 2 hoặc 3) cho học viên đã đăng nhập.
   * Kiểm tra điều kiện cooldown (30s) và tính toán trừ điểm tích lũy.
   * userId lấy từ token, không nhận từ body.
   */
  @Post('unlock')
  @UseGuards(JwtAuthGuard)
  async unlockHint(@Body() dto: UnlockHintDto, @CurrentUser() user: JwtPayload) {
    return this.hintService.unlockHint(dto, user.sub);
  }

  /**
   * GET /api/hints/history/:userId
   * Lịch sử mở gợi ý của học viên — chỉ chủ tài khoản (hoặc giảng viên, quản trị viên) mới được xem.
   */
  @Get('history/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserHintHistory(
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (userId !== user.sub && !isStaff(user.role)) {
      throw new ForbiddenException('Bạn không có quyền xem lịch sử gợi ý này');
    }
    return this.hintService.getUserHintHistory(userId);
  }

  /**
   * POST /api/hints/seed
   * Endpoint khởi tạo/seed 30 hint mẫu cho 10 bài tập. Ghi đè nội dung và chi
   * phí gợi ý nên chỉ ADMIN được gọi.
   */
  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async seedHints() {
    return this.hintService.seedHints();
  }

  /**
   * GET /api/hints/sample-30
   * Trả về dữ liệu 30 hint mẫu phục vụ kiểm thử. Có nội dung gợi ý chưa mở khóa
   * nên chỉ ADMIN được xem.
   */
  @Get('sample-30')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async get30SampleHints() {
    return this.hintService.get30SampleHints();
  }
}
