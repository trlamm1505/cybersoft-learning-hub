import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import type { JwtPayload } from './jwt.strategy';

/**
 * Phải chạy SAU JwtAuthGuard trong cùng @UseGuards(...) (thứ tự trái sang
 * phải) — dựa vào req.user do JwtAuthGuard/JwtStrategy gắn sẵn để biết role
 * hiện tại của người gọi, rồi đối chiếu với @Roles(...) khai báo trên route.
 * Route không có @Roles() thì cho qua (chỉ cần đăng nhập, không giới hạn role).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Chức năng này chỉ dành cho: ${requiredRoles.join(', ')}.`,
      );
    }

    return true;
  }
}
