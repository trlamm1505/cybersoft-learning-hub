import { LeaderboardController } from './leaderboard.controller';

describe('LeaderboardController — asTeacher chỉ có hiệu lực khi login TEACHER thật', () => {
  const mockService = { computeLeaderboard: jest.fn(), getRules: jest.fn() };
  let controller: LeaderboardController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new LeaderboardController(mockService as any);
  });

  it('bỏ qua asTeacher=true khi không có user (chưa đăng nhập)', async () => {
    await controller.getLeaderboard('contest1', 'true', undefined);
    expect(mockService.computeLeaderboard).toHaveBeenCalledWith('contest1', {
      asTeacher: false,
    });
  });

  it('bỏ qua asTeacher=true khi user đăng nhập là STUDENT', async () => {
    await controller.getLeaderboard('contest1', 'true', {
      sub: 'u1',
      email: 'a@b.com',
      role: 'STUDENT',
    });
    expect(mockService.computeLeaderboard).toHaveBeenCalledWith('contest1', {
      asTeacher: false,
    });
  });

  it('chấp nhận asTeacher=true khi user đăng nhập là TEACHER', async () => {
    await controller.getLeaderboard('contest1', 'true', {
      sub: 'u2',
      email: 't@b.com',
      role: 'TEACHER',
    });
    expect(mockService.computeLeaderboard).toHaveBeenCalledWith('contest1', {
      asTeacher: true,
    });
  });

  it('asTeacher=false (hoặc không truyền) luôn là false kể cả với TEACHER', async () => {
    await controller.getLeaderboard('contest1', undefined, {
      sub: 'u2',
      email: 't@b.com',
      role: 'TEACHER',
    });
    expect(mockService.computeLeaderboard).toHaveBeenCalledWith('contest1', {
      asTeacher: false,
    });
  });
});
