import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { RunCodeDto } from './dto/run-code.dto';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  /**
   * GET /api/exercises
   */
  @Get()
  async findAll() {
    return this.exerciseService.findAll();
  }

  /**
   * GET /api/exercises/:slug
   */
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.exerciseService.findBySlug(slug);
  }

  /**
   * POST /api/exercises/:slug/run
   */
  @Post(':slug/run')
  async runCode(@Param('slug') slug: string, @Body() dto: RunCodeDto) {
    return this.exerciseService.runCode(slug, dto);
  }

  /**
   * POST /api/exercises/check-syntax — standalone syntax check (CE), no exercise/DB lookup needed.
   */
  @Post('check-syntax')
  async checkSyntax(@Body() dto: RunCodeDto) {
    return this.exerciseService.checkSyntax(dto.code);
  }

  /**
   * POST /api/exercises/:slug/submit — bắt buộc đăng nhập, userId lấy từ token
   * (không còn nhận từ body, tránh mạo danh học viên khác).
   */
  @Post(':slug/submit')
  @UseGuards(JwtAuthGuard)
  async submitCode(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitCodeDto,
  ) {
    return this.exerciseService.submitCode(slug, dto, user.sub);
  }
}
