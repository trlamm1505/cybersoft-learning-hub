import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS } from '../../common/security/app-throttler.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { RunCodeDto } from './dto/run-code.dto';
import { ExerciseWriteDto } from './dto/exercise-write.dto';
import { StripExerciseSecretsInterceptor } from './exercise-serializer';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { NoKidCodeGuard } from '../../common/auth/no-kid-code.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  /**
   * GET /api/exercises — bắt buộc đăng nhập (Day 29 SEC-04); học viên chỉ nhận bài đúng khối.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(StripExerciseSecretsInterceptor)
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.exerciseService.findAll(user);
  }

  /**
   * GET /api/exercises/playground?band=6-9|10-12 — lộ trình Code Playground chuẩn #1..#N kèm trạng thái (completed / available / locked)
   * do máy chủ tính từ bài nộp AC. Học viên: khối lấy từ tài khoản. Giảng viên/Admin: chọn khối bằng `band`, không bị khóa.
   * Phải khai báo TRƯỚC `:slug` để "playground" không bị hiểu là slug của một bài.
   */
  @Get('playground')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(StripExerciseSecretsInterceptor)
  async playground(@CurrentUser() user: JwtPayload, @Query('band') band?: string) {
    return this.exerciseService.playground(user, typeof band === 'string' ? band : undefined);
  }

  /** POST /api/exercises — chỉ giảng viên/quản trị viên; người tạo được ghi vào authorId. */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async create(@Body() dto: ExerciseWriteDto, @CurrentUser() user: JwtPayload) {
    return this.exerciseService.create(dto, user);
  }

  /** POST /api/exercises/legacy/assign-grade — chỉ ADMIN; body { dryRun?: boolean }. */
  @Post('legacy/assign-grade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async assignLegacyGrade(@Body() body: { dryRun?: boolean }) {
    return this.exerciseService.assignLegacyGrade(body?.dryRun === true);
  }

  /** PATCH /api/exercises/:id — cập nhật một phần; giảng viên chỉ sửa bài của mình. */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: ExerciseWriteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.exerciseService.update(id, dto, user);
  }

  /** DELETE /api/exercises/:id — giảng viên chỉ xóa bài của mình. */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.exerciseService.remove(id, user);
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
   * GET /api/exercises/:slug — bắt buộc đăng nhập (Day 29 SEC-24); học viên khác khối nhận 403.
   */
  @Get(':slug')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(StripExerciseSecretsInterceptor)
  async findBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.exerciseService.findBySlug(slug, user);
  }

  /**
   * POST /api/exercises/:slug/run
   */
  @Post(':slug/run')
  @UseGuards(JwtAuthGuard, NoKidCodeGuard)
  @Throttle(RATE_LIMITS.codeRun)
  async runCode(
    @Param('slug') slug: string,
    @Body() dto: RunCodeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.exerciseService.runCode(slug, dto, user);
  }

  /**
   * POST /api/exercises/check-syntax — standalone syntax check (CE), no exercise/DB lookup needed.
   */
  @Post('check-syntax')
  @UseGuards(JwtAuthGuard, NoKidCodeGuard)
  async checkSyntax(@Body() dto: RunCodeDto) {
    return this.exerciseService.checkSyntax(dto.code);
  }

  /**
   * POST /api/exercises/:slug/submit — bắt buộc đăng nhập, userId lấy từ token
   * (không còn nhận từ body, tránh mạo danh học viên khác).
   */
  @Post(':slug/submit')
  @UseGuards(JwtAuthGuard, NoKidCodeGuard)
  async submitCode(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitCodeDto,
  ) {
    return this.exerciseService.submitCode(slug, dto, user.sub, user);
  }
}
