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
import { OptionalJwtAuthGuard } from '../../common/auth/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

@Controller('authoring/lessons')
export class AuthoringController {
  constructor(private readonly authoringService: AuthoringService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  async createLesson(@Body() dto: CreateLessonDto) {
    return this.authoringService.createLesson(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  async updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.authoringService.updateLesson(id, dto);
  }

  /**
   * GET /api/authoring/lessons — route CÔNG KHAI (khách vãng lai xem catalog
   * không cần đăng nhập), NHƯNG cũng được TeacherAuthoringPage dùng để nạp
   * danh sách bài của chính giáo viên đó cho việc edit (cần solutionCode/đáp
   * án đầy đủ). Dùng OptionalJwtAuthGuard: có Bearer token hợp lệ + role
   * TEACHER thì trả đủ dữ liệu; không có token (hoặc token không phải
   * TEACHER) thì luôn trả bản đã lọc (ẩn solutionCode, hidden testCase
   * output, quiz isCorrect/explanation) — client KHÔNG còn cách nào tự tắt
   * việc lọc này bằng query param như code cũ (`?forStudent=false`).
   */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@CurrentUser() user?: JwtPayload) {
    const isAuthenticatedTeacher = user?.role === 'TEACHER';
    return this.authoringService.findAll(!isAuthenticatedTeacher);
  }

  @Get('export/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  async exportLesson(@Param('id') id: string) {
    return this.authoringService.exportLessonJson(id);
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  async importLesson(@Body() dto: ImportLessonDto) {
    return this.authoringService.importLessonJson(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  async findOne(@Param('id') id: string) {
    return this.authoringService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  async deleteLesson(@Param('id') id: string) {
    return this.authoringService.deleteLesson(id);
  }
}
