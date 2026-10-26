import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { QuestionBankService, type BankListQuery, type BankUpdateInput } from './question-bank.service';

/** Quản lý Ngân hàng đề: chỉ giảng viên phụ trách lớp khối 6-9 / 10-12 (và Admin). */
@Controller('teacher/question-bank')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class QuestionBankController {
  constructor(private readonly service: QuestionBankService) {}

  @Get('access')
  access(@CurrentUser() user: JwtPayload) {
    return this.service.access(user);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() q: BankListQuery) {
    return this.service.list(user, q);
  }

  @Get(':slug')
  detail(@CurrentUser() user: JwtPayload, @Param('slug') slug: string) {
    return this.service.detail(user, slug);
  }

  @Patch(':slug')
  update(@CurrentUser() user: JwtPayload, @Param('slug') slug: string, @Body() body: BankUpdateInput) {
    return this.service.update(user, slug, body ?? {});
  }

  @Delete(':slug')
  remove(@CurrentUser() user: JwtPayload, @Param('slug') slug: string) {
    return this.service.remove(user, slug);
  }
}
