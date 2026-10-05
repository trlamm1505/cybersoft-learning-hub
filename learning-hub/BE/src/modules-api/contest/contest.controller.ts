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
import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS } from '../../common/security/app-throttler.guard';
import { ContestService } from './contest.service';
import { ContestAttemptService } from './contest-attempt.service';
import { ContestManageService } from './contest-manage.service';
import { FinishContestDto } from './dto/finish-contest.dto';
import type { IntegrityReviewInput } from '../integrity/integrity.service';
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
import { StudentOnlyGuard } from '../../common/auth/student-only.guard';

@Controller('contests')
export class ContestController {
  constructor(
    private readonly contestService: ContestService,
    private readonly contestSubmissionService: ContestSubmissionService,
    private readonly attemptService: ContestAttemptService,
    private readonly manageService: ContestManageService,
  ) {}

  /**
   * Tạo/sửa/xoá cuộc thi chỉ dành cho TEACHER đã đăng nhập — trước đây các
   * route này hoàn toàn công khai, ai cũng gọi API tạo/sửa/xoá cuộc thi.
   * authorId lấy từ token, không nhận từ client.
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async createContestLegacy(@CurrentUser() user: JwtPayload, @Body() dto: CreateContestDto) {
    return this.contestService.createContest(dto, user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async createContest(@CurrentUser() user: JwtPayload, @Body() dto: CreateContestDto) {
    return this.contestService.createContest(dto, user.sub);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async updateContest(
    @Param('id') id: string,
    @Body() dto: UpdateContestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contestService.updateContest(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async deleteContest(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contestService.deleteContest(id, user);
  }

  /**
   * Xem danh sách/chi tiết cuộc thi CÔNG KHAI (không cần đăng nhập) — nhưng
   * cờ "isRegistered" phải dựa trên user thật đã đăng nhập (nếu có), không
   * còn tin `?studentId=` do client tự khai trong query string.
   */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@CurrentUser() user?: JwtPayload) {
    return this.contestService.findAll(user);
  }

  /** Ngân hàng đề để giảng viên dựng cuộc thi (đặt trước ':id' để không bị nuốt route). */
  @Get('bank/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async questionBank(
    @Query() query: { q?: string; category?: string; difficulty?: string; limit?: string },
  ) {
    return this.manageService.listQuestionBank(query);
  }

  @Get('bank/exercises')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async exerciseBank(@Query() query: { q?: string; topic?: string }) {
    return this.manageService.listExerciseBank(query);
  }

  @Get(':id/status')
  @UseGuards(OptionalJwtAuthGuard)
  async checkStatus(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.contestService.checkContestStatus(id, user);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.contestService.findOne(id, user);
  }

  /**
   * Đăng ký/nộp bài thi bắt buộc đăng nhập — studentId/studentName lấy từ
   * token, không còn nhận từ body. Trước đây bất kỳ ai cũng đăng ký/nộp bài
   * mạo danh học viên khác chỉ bằng cách tự khai studentId trong request.
   */
  @Post(':id/register')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, StudentOnlyGuard)
  async registerContest(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contestService.registerContest(id, user.sub);
  }

  /** Bắt buộc đăng nhập; học viên phải đăng ký cuộc thi (kiểm tra ở service). */
  @Get(':id/problems/:slug')
  @UseGuards(JwtAuthGuard)
  async getProblemForStudent(
    @Param('id') id: string,
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contestSubmissionService.getProblemForStudent(id, slug, user);
  }

  /** Chỉ học viên đã đăng ký mới được nộp; giảng viên/quản trị viên bị chặn 403. */
  @Post(':id/submissions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, StudentOnlyGuard)
  @Throttle(RATE_LIMITS.contestSubmit)
  async submitProblem(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitContestProblemDto,
  ) {
    return this.contestSubmissionService.submit(id, dto, user.sub);
  }

  /** Bắt đầu lượt thi: đồng hồ cá nhân do máy chủ giữ (gọi lại vẫn trả lượt cũ). */
  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, StudentOnlyGuard)
  async startAttempt(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.attemptService.start(id, user);
  }

  /** Lượt thi và kết quả từng đề của chính học viên (khôi phục khi tải lại trang/đổi máy). */
  @Get(':id/my-attempt')
  @UseGuards(JwtAuthGuard, StudentOnlyGuard)
  async myAttempt(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.attemptService.getMine(id, user);
  }

  /** Nộp bài thi (kết thúc lượt), kèm tín hiệu liêm chính tối thiểu nếu cuộc thi bật giám sát. */
  @Post(':id/finish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, StudentOnlyGuard)
  async finishAttempt(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: FinishContestDto,
  ) {
    return this.attemptService.finish(id, user, dto?.integrity);
  }

  /** Kết quả theo thí sinh và trạng thái xem xét trung thực; chỉ giảng viên/quản trị viên. */
  @Get(':id/manage/results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async manageResults(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.manageService.getResults(id, user);
  }

  @Get(':id/manage/integrity/:attemptId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async integrityDetail(
    @Param('id') id: string,
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.manageService.getIntegrityDetail(id, attemptId, user);
  }

  @Put(':id/manage/integrity/:attemptId/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async reviewIntegrity(
    @Param('id') id: string,
    @Param('attemptId') attemptId: string,
    @Body() body: IntegrityReviewInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.manageService.reviewIntegrity(id, attemptId, body, user);
  }
}
