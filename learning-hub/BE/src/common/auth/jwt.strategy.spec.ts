import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

const ID = '507f1f77bcf86cd799439011';

function build(user: unknown) {
  const users: any = {
    findById: jest.fn().mockReturnValue({ select: () => ({ lean: () => Promise.resolve(user) }) }),
  };
  const config: any = { get: () => 'unit-test-secret-unit-test-secret-1234' };
  return new JwtStrategy(config, users);
}

describe('JwtStrategy.validate: thu hồi quyền tức thì', () => {
  it('tài khoản bị khóa nhận 401 với code ACCOUNT_LOCKED và thông báo tiếng Việt', async () => {
    const s = build({ role: 'STUDENT', status: 'LOCKED' });
    const err: UnauthorizedException = await s.validate({ sub: ID, email: 'a@b.c', role: 'STUDENT' }).catch((e) => e);
    expect(err).toBeInstanceOf(UnauthorizedException);
    expect(err.getStatus()).toBe(401);
    expect(err.getResponse()).toMatchObject({
      code: 'ACCOUNT_LOCKED',
      message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
    });
  });

  it('tài khoản hoạt động: vai trò và khối học lấy từ CSDL, không tin token', async () => {
    const s = build({ role: 'TEACHER', status: 'ACTIVE', ageGroup: '10-12' });
    await expect(s.validate({ sub: ID, email: 'a@b.c', role: 'ADMIN' })).resolves.toMatchObject({ role: 'TEACHER', ageGroup: '10-12' });
  });

  it('mở khóa xong thì request kế tiếp qua ngay (không cache trạng thái cũ)', async () => {
    const lean = jest.fn().mockResolvedValueOnce({ role: 'STUDENT', status: 'LOCKED' }).mockResolvedValueOnce({ role: 'STUDENT', status: 'ACTIVE' });
    const users: any = { findById: () => ({ select: () => ({ lean }) }) };
    const s = new JwtStrategy({ get: () => 'unit-test-secret-unit-test-secret-1234' } as any, users);
    await expect(s.validate({ sub: ID, email: 'a@b.c', role: 'STUDENT' })).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(s.validate({ sub: ID, email: 'a@b.c', role: 'STUDENT' })).resolves.toMatchObject({ role: 'STUDENT' });
  });

  it('id không hợp lệ hoặc tài khoản không còn tồn tại bị từ chối', async () => {
    await expect(build(null).validate({ sub: 'xyz', email: '', role: 'STUDENT' })).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(build(null).validate({ sub: ID, email: '', role: 'STUDENT' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
