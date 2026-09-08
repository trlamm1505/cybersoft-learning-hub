import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { HintService } from './hint.service';
import { UnlockHintDto } from './dto/unlock-hint.dto';

@Controller('hints')
export class HintController {
  constructor(private readonly hintService: HintService) {}

  /**
   * GET /api/hints/exercise/:exerciseSlug?userId=...
   * Lấy danh sách thông tin hints của một bài tập kèm trạng thái đã mở của học viên.
   */
  @Get('exercise/:exerciseSlug')
  async getHintsByExercise(
    @Param('exerciseSlug') exerciseSlug: string,
    @Query('userId') userId?: string,
  ) {
    return this.hintService.getHintsByExercise(exerciseSlug, userId);
  }

  /**
   * POST /api/hints/unlock
   * Mở một cấp độ gợi ý (1, 2 hoặc 3) cho học viên.
   * Kiểm tra điều kiện cooldown (30s) và tính toán trừ điểm tích lũy.
   */
  @Post('unlock')
  async unlockHint(@Body() dto: UnlockHintDto) {
    return this.hintService.unlockHint(dto);
  }

  /**
   * GET /api/hints/history/:userId
   * Lịch sử mở gợi ý của học viên.
   */
  @Get('history/:userId')
  async getUserHintHistory(@Param('userId') userId: string) {
    return this.hintService.getUserHintHistory(userId);
  }

  /**
   * POST /api/hints/seed
   * Endpoint khởi tạo/seed 30 hint mẫu cho 10 bài tập.
   */
  @Post('seed')
  async seedHints() {
    return this.hintService.seedHints();
  }

  /**
   * GET /api/hints/sample-30
   * Trả về dữ liệu 30 hint mẫu phục vụ kiểm thử.
   */
  @Get('sample-30')
  async get30SampleHints() {
    return this.hintService.get30SampleHints();
  }
}
