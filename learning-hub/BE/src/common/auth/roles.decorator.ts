import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Đánh dấu route chỉ cho phép các role liệt kê ở đây truy cập. Phải dùng
 * cùng @UseGuards(JwtAuthGuard, RolesGuard) — decorator này chỉ gắn metadata,
 * RolesGuard mới là nơi thực sự enforce.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
