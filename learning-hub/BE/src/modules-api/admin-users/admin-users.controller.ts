import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { AuditLogService } from '../admin-portal/audit-log.service';
import { AdminUsersService } from './admin-users.service';

/**
 * Quản lý người dùng: chỉ ADMIN (giảng viên và học viên nhận 403). Service kiểm tra lại vai trò.
 * Mọi thay đổi (khóa/mở khóa, đổi vai trò, tạo/sửa) được ghi vào audit_logs. KHÔNG có endpoint xóa cứng người dùng.
 */
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(
    private readonly service: AdminUsersService,
    private readonly audit: AuditLogService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('ageGroup') ageGroup?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.list(user, { role, status, ageGroup, q, page, pageSize });
  }

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      fullName?: unknown;
      email?: unknown;
      password?: unknown;
      role?: unknown;
      ageGroup?: unknown;
    },
  ) {
    const created = await this.service.create(user, body ?? {});
    await this.audit.record(user, 'USER_CREATE', 'USER', created.id, null, {
      fullName: created.fullName,
      email: created.email,
      role: created.role,
      ageGroup: created.ageGroup,
    });
    return created;
  }

  /** Khóa/mở khóa hàng loạt. Đặt trước ':id/...' để không bị nhầm thành id. */
  @Patch('bulk-status')
  async bulkStatus(
    @CurrentUser() user: JwtPayload,
    @Body() body: { userIds?: unknown; isActive?: unknown },
  ) {
    const result = await this.service.bulkSetStatus(user, body?.userIds, body?.isActive);
    if (result.updated > 0) {
      const action = body.isActive === true ? 'BULK_UNLOCK' : 'BULK_LOCK';
      await this.audit.record(
        user,
        action,
        'USER',
        `bulk:${result.updated}`,
        result.changed.map((c) => ({ id: c.id, email: c.email, status: c.before })),
        result.changed.map((c) => ({ id: c.id, email: c.email, status: c.after })),
      );
    }
    return result;
  }

  @Get(':id/profile')
  profile(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('tzOffset') tzOffset?: string,
  ) {
    return this.service.getProfile(user, id, tzOffset);
  }

  /** Sửa thông tin cơ bản (họ tên, khối học) và/hoặc đặt lại mật khẩu. */
  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { fullName?: unknown; ageGroup?: unknown; password?: unknown },
  ) {
    const before = await this.audit.userSnapshot(id);
    const result = await this.service.update(user, id, body ?? {});
    await this.audit.record(
      user,
      'USER_UPDATE',
      'USER',
      id,
      before,
      // Không bao giờ ghi mật khẩu: chỉ ghi cờ đã đặt lại.
      { fullName: result.fullName, ageGroup: result.ageGroup, passwordReset: result.passwordReset },
    );
    return result;
  }

  @Put(':id/role')
  async setRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { role?: unknown },
  ) {
    const before = await this.audit.userSnapshot(id);
    const result = await this.service.setRole(user, id, body?.role);
    await this.audit.record(user, 'ROLE_CHANGE', 'USER', id, before, { ...before, role: result.role, status: result.status });
    return result;
  }

  @Post(':id/revoke-teacher')
  async revokeTeacher(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { mode?: unknown },
  ) {
    const before = await this.audit.userSnapshot(id);
    const result = await this.service.revokeTeacher(user, id, body?.mode ?? 'STUDENT');
    await this.audit.record(user, 'ROLE_CHANGE', 'USER', id, before, { ...before, role: result.role, status: result.status });
    return result;
  }

  @Put(':id/status')
  async setStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { status?: unknown },
  ) {
    const before = await this.audit.userSnapshot(id);
    const result = await this.service.setStatus(user, id, body?.status);
    if (before?.status !== result.status) {
      await this.audit.record(
        user,
        result.status === 'LOCKED' ? 'USER_LOCK' : 'USER_UNLOCK',
        'USER',
        id,
        before,
        { ...before, status: result.status },
      );
    }
    return result;
  }
}
