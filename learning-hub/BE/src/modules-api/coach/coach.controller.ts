import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CoachService } from './coach.service';
import { CoachChatDto } from './dto/coach-chat.dto';
import { DebugLoopDto } from './dto/debug-loop.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

@Controller('coach')
@UseGuards(JwtAuthGuard)
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  /**
   * POST /api/coach/chat
   * Gửi một câu hỏi tới AI Coach cho một bài tập cụ thể. Context được build
   * lại từ DB mỗi lượt (đề bài, attempt, hint đã mở) — không tin tưởng dữ
   * liệu context do client tự gửi lên. Bắt buộc đăng nhập, userId lấy từ token.
   */
  @Post('chat')
  async chat(@Body() dto: CoachChatDto, @CurrentUser() user: JwtPayload) {
    return this.coachService.chat(dto, user.sub);
  }

  /**
   * POST /api/coach/debug-loop
   * Phân tích kết quả TEST THẬT của một submission đã lưu (compile/runtime/
   * test fail) và trả về loại lỗi, feedback trích dẫn bằng chứng, bước kế
   * tiếp và trạng thái vòng lặp thử-sai (có giới hạn tối đa). userId lấy từ token.
   */
  @Post('debug-loop')
  async debugLoop(@Body() dto: DebugLoopDto, @CurrentUser() user: JwtPayload) {
    return this.coachService.debugLoop(dto, user.sub);
  }

  /**
   * GET /api/coach/history/:userId/:exerciseSlug
   * Lịch sử hội thoại AI Coach của học viên — chỉ chủ tài khoản (hoặc TEACHER)
   * mới được xem, tránh đọc trộm lịch sử hỏi-đáp của học viên khác.
   */
  @Get('history/:userId/:exerciseSlug')
  async getHistory(
    @Param('userId') userId: string,
    @Param('exerciseSlug') exerciseSlug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (userId !== user.sub && user.role !== 'TEACHER') {
      throw new ForbiddenException('Bạn không có quyền xem lịch sử này');
    }
    return this.coachService.getHistory(userId, exerciseSlug);
  }
}
