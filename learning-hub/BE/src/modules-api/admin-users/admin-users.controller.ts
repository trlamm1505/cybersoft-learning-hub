import {
  Body,
  Controller,
  Get,
  Param,
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
import { AdminUsersService } from './admin-users.service';

/** Quản lý người dùng: chỉ ADMIN (giảng viên và học viên nhận 403). Service kiểm tra lại vai trò. */
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.list(user, { role, status, q, page, pageSize });
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      fullName?: unknown;
      email?: unknown;
      password?: unknown;
      role?: unknown;
    },
  ) {
    return this.service.create(user, body ?? {});
  }

  @Get(':id/profile')
  profile(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('tzOffset') tzOffset?: string,
  ) {
    return this.service.getProfile(user, id, tzOffset);
  }

  @Put(':id/role')
  setRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { role?: unknown },
  ) {
    return this.service.setRole(user, id, body?.role);
  }

  @Post(':id/revoke-teacher')
  revokeTeacher(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { mode?: unknown },
  ) {
    return this.service.revokeTeacher(user, id, body?.mode ?? 'STUDENT');
  }

  @Put(':id/status')
  setStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { status?: unknown },
  ) {
    return this.service.setStatus(user, id, body?.status);
  }
}
