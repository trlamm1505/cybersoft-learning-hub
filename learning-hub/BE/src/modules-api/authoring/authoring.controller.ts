import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthoringService } from './authoring.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ImportLessonDto } from './dto/import-lesson.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

@Controller('authoring/lessons')
export class AuthoringController {
  constructor(private readonly authoringService: AuthoringService) {}

  @Get('catalog/resources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async getCatalogResources() {
    return this.authoringService.getCatalogResources();
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async createLesson(@CurrentUser() user: JwtPayload, @Body() dto: CreateLessonDto) {
    return this.authoringService.createLesson(dto, user.sub);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async updateLesson(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.authoringService.updateLesson(id, dto, user);
  }

  /**
   * GET /api/authoring/lessons — bắt buộc đăng nhập (không token → 401). Giảng viên/Admin nhận đủ dữ liệu để soạn/sửa;
   * học viên luôn nhận bản đã lọc theo khối (ẩn solutionCode, authorId, output test ẩn, đáp án trắc nghiệm) — client
   * KHÔNG có cách nào tự tắt việc lọc này bằng query param.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@CurrentUser() user: JwtPayload) {
    // Day 29 (SEC-03/24): bắt buộc đăng nhập. Học viên chỉ nhận bài đã xuất bản, đúng khối, đã lọc đáp án/authorId.
    const isStaff = user?.role === 'TEACHER' || user?.role === 'ADMIN';
    return this.authoringService.findAll(!isStaff, user);
  }

  @Get('export/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async exportLesson(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.authoringService.exportLessonJson(id, user);
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async importLesson(@CurrentUser() user: JwtPayload, @Body() dto: ImportLessonDto) {
    return this.authoringService.importLessonJson(dto, user.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.authoringService.findOne(id, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async deleteLesson(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.authoringService.deleteLesson(id, user);
  }
}
