import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { RATE_LIMITS } from '../../common/security/app-throttler.guard';
import { AdminPortalService } from './admin-portal.service';
import { AuditLogService } from './audit-log.service';
import { GEMINI_KEY, PROMPT_DEFS, SystemConfigService } from './system-config.service';

/** Admin Portal v2: cấu hình hệ thống, nhật ký, tổng quan, lớp và giám sát. Chỉ ADMIN; service kiểm tra lại vai trò. */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPortalController {
  constructor(
    private readonly portal: AdminPortalService,
    private readonly configs: SystemConfigService,
    private readonly audit: AuditLogService,
  ) {}

  // ---------- Cấu hình hệ thống ----------

  /** Danh sách cấu hình. API key chỉ trả dạng che (vd AIzaSy...****), không bao giờ trả bản rõ. */
  @Get('configs')
  listConfigs() {
    return this.configs.list();
  }

  /** Lưu API key Gemini (mã hóa khi lưu) hoặc một system prompt (key = prompt.coach | prompt.debug | prompt.ailab). */
  @Put('configs')
  async updateConfig(@CurrentUser() user: JwtPayload, @Body() body: { key?: unknown; value?: unknown }) {
    const key = typeof body?.key === 'string' ? body.key : '';
    if (key === GEMINI_KEY) {
      const { before, after } = await this.configs.setGeminiKey(body.value, user.sub);
      // Diff của khóa bí mật chỉ chứa bản che.
      await this.audit.record(user, 'CONFIG_UPDATE', 'CONFIG', key, { masked: before }, { masked: after });
      return { key, masked: after };
    }
    if (!PROMPT_DEFS.some((d) => d.configKey === key)) throw new BadRequestException('Khóa cấu hình không hợp lệ.');
    const { before, after } = await this.configs.setPrompt(key, body.value, user.sub);
    await this.audit.record(user, 'CONFIG_UPDATE', 'CONFIG', key, { value: before }, { value: after });
    return { key, updated: true };
  }

  /** Gọi thử Gemini bằng key mới nhập (chưa lưu) hoặc key hiện tại; timeout 3 giây. */
  @Post('configs/test-gemini')
  testGemini(@Body() body: { apiKey?: unknown }) {
    return this.configs.pingGemini(typeof body?.apiKey === 'string' ? body.apiKey : undefined).then(({ valid, latencyMs, reason }) => ({ valid, latencyMs, ...(reason ? { reason } : {}) }));
  }

  // ---------- Nhật ký ----------

  @Get('audit-logs')
  auditLogs(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('action') action?: string, @Query('actorEmail') actorEmail?: string) {
    return this.audit.list({ page, pageSize, action, actor: actorEmail });
  }

  // ---------- Tổng quan, lớp, giám sát ----------

  @Get('dashboard/summary')
  summary(@CurrentUser() user: JwtPayload) {
    return this.portal.dashboardSummary(user);
  }

  @Get('portal/classes')
  classes(@CurrentUser() user: JwtPayload, @Query('ageGroup') ageGroup?: string) {
    return this.portal.classesOverview(user, ageGroup || undefined);
  }

  @Get('portal/classes/:classId')
  classDetail(@CurrentUser() user: JwtPayload, @Param('classId') classId: string) {
    return this.portal.classDetail(user, classId);
  }

  /** Lưu trữ (đã bế giảng) hoặc kích hoạt lại một lớp/khóa. */
  @Put('classes/:classId/archive')
  archive(@CurrentUser() user: JwtPayload, @Param('classId') classId: string, @Body() body: { archived?: unknown }) {
    return this.portal.setArchived(user, classId, body?.archived);
  }

  /** Gán một hoặc nhiều giảng viên phụ trách lớp; có hiệu lực ngay. */
  @Put('classes/:classId/teachers')
  assignTeachers(@CurrentUser() user: JwtPayload, @Param('classId') classId: string, @Body() body: { teacherIds?: unknown }) {
    return this.portal.assignTeachers(user, classId, body?.teacherIds);
  }

  /** Gỡ một giảng viên; được gỡ cả thẻ duy nhất nếu đó là tài khoản không còn tồn tại hoặc đang bị khóa. */
  @Delete('classes/:classId/teachers/:teacherId')
  removeTeacher(@CurrentUser() user: JwtPayload, @Param('classId') classId: string, @Param('teacherId') teacherId: string) {
    return this.portal.removeTeacher(user, classId, teacherId);
  }

  /** Kiểm tra song song 5 cụm chức năng. Giới hạn 1 yêu cầu / 10 giây cho mỗi Admin. */
  @Get('health-check')
  @Throttle(RATE_LIMITS.adminHealth)
  health(@CurrentUser() user: JwtPayload) {
    return this.portal.healthCheck(user);
  }
}
