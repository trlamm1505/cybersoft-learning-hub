import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS } from '../../common/security/app-throttler.guard';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { RunCodeDto } from './dto/run-code.dto';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
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
   * GET /api/exercises/:slug/full — CHỈ giảng viên/quản trị viên, trả về đầy đủ
   * solutionCode và toàn bộ testCases (kể cả hidden), dùng để import 1
   * exercise có sẵn vào form soạn thảo bài thi.
   */
  @Get(':slug/full')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async findBySlugFull(@Param('slug') slug: string) {
    return this.exerciseService.findBySlugFull(slug);
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
  @UseGuards(JwtAuthGuard)
  @Throttle(RATE_LIMITS.codeRun)
  async runCode(@Param('slug') slug: string, @Body() dto: RunCodeDto) {
    return this.exerciseService.runCode(slug, dto);
  }

  /**
   * POST /api/exercises/check-syntax — standalone syntax check (CE), no exercise/DB lookup needed.
   */
  @Post('check-syntax')
  @UseGuards(JwtAuthGuard)
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
