import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../common/auth/roles.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { AdminUsersController } from '../admin-users/admin-users.controller';
import { AdminClassesController } from '../teacher-analytics/admin-classes.controller';
import { AdminPortalController } from './admin-portal.controller';

/**
 * Mọi controller có tiền tố /admin phải bọc JwtAuthGuard + RolesGuard và chỉ cho vai trò ADMIN, và KHÔNG route nào được nới quyền
 * (đặt lại @Roles ở cấp method) hay bỏ guard. Thêm controller /admin mới mà quên guard thì test này đỏ ngay.
 */
describe('RBAC: toàn bộ route /admin chỉ dành cho ADMIN', () => {
  const controllers = [AdminPortalController, AdminUsersController, AdminClassesController];

  it.each(controllers.map((c) => [c.name, c] as const))('%s: JwtAuthGuard + RolesGuard và @Roles(ADMIN) ở cấp lớp', (_n, ctrl) => {
    const guards = (Reflect.getMetadata(GUARDS_METADATA, ctrl) ?? []) as unknown[];
    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    expect(Reflect.getMetadata(ROLES_KEY, ctrl)).toEqual(['ADMIN']);
  });

  it.each(controllers.map((c) => [c.name, c] as const))('%s: không route nào ghi đè quyền hay bỏ guard', (_n, ctrl) => {
    for (const name of Object.getOwnPropertyNames(ctrl.prototype)) {
      if (name === 'constructor') continue;
      const handler = (ctrl.prototype as unknown as Record<string, unknown>)[name] as object;
      const roles = Reflect.getMetadata(ROLES_KEY, handler as never);
      if (roles !== undefined) expect(roles).toEqual(['ADMIN']);
    }
  });

  it('có đúng 3 controller /admin trong mã nguồn (thêm controller mới phải đăng ký vào test này)', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.controller\.ts$/.test(e.name) && /@Controller\(\s*'admin/.test(fs.readFileSync(p, 'utf8'))) found.push(e.name);
      }
    };
    walk(path.join(__dirname, '..', '..'));
    expect(found.sort()).toEqual(['admin-classes.controller.ts', 'admin-portal.controller.ts', 'admin-users.controller.ts']);
  });
});
