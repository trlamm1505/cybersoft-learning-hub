import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { QuizBankService, type QuizBankListQuery, type QuizQuestionInput } from './quiz-bank.service';

/**
 * Ngân hàng đề trắc nghiệm (Day 30): /teacher/question-bank/questions. Chỉ giảng viên phụ trách lớp khối 6-9 / 10-12 và
 * Admin. Được đăng ký TRƯỚC QuestionBankController để "questions" không bị hiểu nhầm là :slug của bài code.
 */
@Controller('teacher/question-bank/questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class QuizBankController {
  constructor(private readonly service: QuizBankService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() q: QuizBankListQuery) {
    return this.service.list(user, q ?? {});
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: QuizQuestionInput) {
    return this.service.create(user, body ?? {});
  }

  @Get(':id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.detail(user, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: QuizQuestionInput) {
    return this.service.update(user, id, body ?? {});
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(user, id);
  }
}
