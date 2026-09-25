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
import { ContestService } from './contest.service';
import { ContestSubmissionService } from './contest-submission.service';
import { CreateContestDto } from './dto/create-contest.dto';
import { UpdateContestDto } from './dto/update-contest.dto';
import { SubmitContestProblemDto } from './dto/submit-contest-problem.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/auth/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

@Controller('contests')
export class ContestController {
  constructor(
    private readonly contestService: ContestService,
    private readonly contestSubmissionService: ContestSubmissionService,
  ) {}

  /**
   * Tạo/sửa/xoá cuộc thi chỉ dành cho TEACHER đã đăng nhập — trước đây các
   * route này hoàn toàn công khai, ai cũng gọi API tạo/sửa/xoá cuộc thi.
   * authorId lấy từ token, không nhận từ client.
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  async createContestLegacy(@CurrentUser() user: JwtPayload, @Body() dto: CreateContestDto) {
    return this.contestService.createContest(dto, user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  async createContest(@CurrentUser() user: JwtPayload, @Body() dto: CreateContestDto) {
    return this.contestService.createContest(dto, user.sub);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  async updateContest(@Param('id') id: string, @Body() dto: UpdateContestDto) {
    return this.contestService.updateContest(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  async deleteContest(@Param('id') id: string) {
    return this.contestService.deleteContest(id);
  }

  /**
   * Xem danh sách/chi tiết cuộc thi CÔNG KHAI (không cần đăng nhập) — nhưng
   * cờ "isRegistered" phải dựa trên user thật đã đăng nhập (nếu có), không
   * còn tin `?studentId=` do client tự khai trong query string.
   */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@CurrentUser() user?: JwtPayload) {
    return this.contestService.findAll(user?.sub);
  }

  @Get(':id/status')
  @UseGuards(OptionalJwtAuthGuard)
  async checkStatus(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.contestService.checkContestStatus(id, user?.sub);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.contestService.findOne(id, user?.sub);
  }

  /**
   * Đăng ký/nộp bài thi bắt buộc đăng nhập — studentId/studentName lấy từ
   * token, không còn nhận từ body. Trước đây bất kỳ ai cũng đăng ký/nộp bài
   * mạo danh học viên khác chỉ bằng cách tự khai studentId trong request.
   */
  @Post(':id/register')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async registerContest(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contestService.registerContest(id, user.sub);
  }

  @Get(':id/problems/:slug')
  async getProblemForStudent(
    @Param('id') id: string,
    @Param('slug') slug: string,
  ) {
    return this.contestSubmissionService.getProblemForStudent(id, slug);
  }

  @Post(':id/submissions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async submitProblem(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitContestProblemDto,
  ) {
    return this.contestSubmissionService.submit(id, dto, user.sub);
  }
}
