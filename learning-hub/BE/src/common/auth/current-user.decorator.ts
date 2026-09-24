import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from './jwt.strategy';

/**
 * Lấy user hiện tại từ token đã verify (req.user), thay vì tin userId do
 * client tự gửi qua query/body — đây chính là chỗ vá lỗ hổng "quiz review
 * lấy userId từ query string" mà audit chỉ ra.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
