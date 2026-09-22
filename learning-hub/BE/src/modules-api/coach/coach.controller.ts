import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CoachService } from './coach.service';
import { CoachChatDto } from './dto/coach-chat.dto';

@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  /**
   * POST /api/coach/chat
   * Gửi một câu hỏi tới AI Coach cho một bài tập cụ thể. Context được build
   * lại từ DB mỗi lượt (đề bài, attempt, hint đã mở) — không tin tưởng dữ
   * liệu context do client tự gửi lên.
   */
  @Post('chat')
  async chat(@Body() dto: CoachChatDto) {
    return this.coachService.chat(dto);
  }

  /**
   * GET /api/coach/history/:userId/:exerciseSlug
   * Lịch sử hội thoại AI Coach của học viên cho một bài tập.
   */
  @Get('history/:userId/:exerciseSlug')
  async getHistory(@Param('userId') userId: string, @Param('exerciseSlug') exerciseSlug: string) {
    return this.coachService.getHistory(userId, exerciseSlug);
  }
}
