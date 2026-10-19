import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BlockPuzzleService } from './block-puzzle.service';
import { BlockPuzzleProgress } from '../../modules-system/database/schemas/block-puzzle-progress.schema';
import { User } from '../../modules-system/database/schemas/user.schema';
import { Lesson } from '../../modules-system/database/schemas/lesson.schema';

describe('BlockPuzzleService — bảng vinh danh chỉ cho bé phá đảo 100%', () => {
  const OID = (n: number) => n.toString(16).padStart(24, '0');
  const slugs = (n: number) => Array.from({ length: n }, (_, i) => `blockly-maze-level-${i + 1}`);
  const items = (names: string[], day: number) =>
    names.map((s, i) => ({ s, at: new Date(Date.UTC(2026, 9, day, 8, i)) }));
  let service: BlockPuzzleService;
  const progress: any = { aggregate: jest.fn() };
  const users: any = { find: jest.fn(), findById: jest.fn() };
  const lessons: any = { find: jest.fn() };

  beforeEach(async () => {
    lessons.find.mockReturnValue({ select: () => ({ lean: jest.fn().mockResolvedValue([]) }) });
    progress.aggregate.mockResolvedValue([
      // 1: phá đảo ngày 5; 2: phá đảo ngày 3 (sớm hơn); 3: mới chơi 4/10 màn; 4: slug giả; 9: giảng viên
      { _id: { g: 'blockly-maze', u: OID(1) }, items: items(slugs(10), 5) },
      { _id: { g: 'blockly-maze', u: OID(2) }, items: items(slugs(10), 3) },
      { _id: { g: 'blockly-maze', u: OID(3) }, items: items(slugs(4), 2) },
      { _id: { g: 'blockly-maze', u: OID(4) }, items: items(Array.from({ length: 10 }, (_, i) => `fake-${i}`), 1) },
      { _id: { g: 'blockly-maze', u: OID(9) }, items: items(slugs(10), 1) },
      { _id: { g: 'blockly-turtle', u: OID(1) }, items: items(['blockly-turtle-level-1'], 6) },
    ]);
    users.find.mockReturnValue({
      select: () => ({
        lean: jest.fn().mockResolvedValue([
          { _id: OID(1), fullName: 'Nguyễn Văn An' },
          { _id: OID(2), fullName: 'Lê Thị Bình' },
          { _id: OID(3), fullName: 'Trần Chi' },
          { _id: OID(4), fullName: 'Phạm Dũng' },
        ]),
      }),
    });
    const module = await Test.createTestingModule({
      providers: [
        BlockPuzzleService,
        { provide: getModelToken(BlockPuzzleProgress.name), useValue: progress },
        { provide: getModelToken(User.name), useValue: users },
        { provide: getModelToken(Lesson.name), useValue: lessons },
      ],
    }).compile();
    service = module.get(BlockPuzzleService);
  });

  it('chỉ bé phá đảo 100% lên bảng, xếp theo ai phá đảo sớm hơn, hiện họ tên đầy đủ', async () => {
    const res = await service.leaderboard('blockly-maze', OID(1));
    expect(res.totalLevels).toBe(10);
    expect(res.top.map((r) => [r.rank, r.fullName])).toEqual([
      [1, 'Lê Thị Bình'],
      [2, 'Nguyễn Văn An'],
    ]);
    expect(res.top.find((r) => r.isMe)?.fullName).toBe('Nguyễn Văn An');
    expect(JSON.stringify(res)).not.toMatch(/email|Trần Chi|Phạm Dũng/);
  });

  it('bé mới chơi vài màn không lên bảng nhưng được báo tiến độ của chính mình', async () => {
    const res = await service.leaderboard('blockly-maze', OID(3));
    expect(res.top.some((r) => r.userId === OID(3))).toBe(false);
    expect(res.myProgress).toEqual({ levelsCompleted: 4, totalLevels: 10 });
  });

  it('slug giả không được tính thành phá đảo; tài khoản giảng viên bị loại', async () => {
    const res = await service.leaderboard('blockly-maze', OID(4));
    expect(res.top.some((r) => r.userId === OID(4) || r.userId === OID(9))).toBe(false);
  });

  it('chỉ lấy top 10 và đặt dòng của mình riêng khi nằm ngoài top', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      _id: { g: 'blockly-maze', u: OID(100 + i) },
      items: items(slugs(10), 1 + i),
    }));
    progress.aggregate.mockResolvedValue(many);
    users.find.mockReturnValue({
      select: () => ({
        lean: jest.fn().mockResolvedValue(many.map((m) => ({ _id: m._id.u, fullName: `Bé ${m._id.u.slice(-2)}` }))),
      }),
    });
    const res = await service.leaderboard('blockly-maze', OID(111));
    expect(res.top).toHaveLength(10);
    expect(res.total).toBe(12);
    expect(res.me).toMatchObject({ rank: 12, isMe: true });
  });

  it('records: hạng null khi chưa phá đảo', async () => {
    const recs = await service.records(OID(1));
    expect(recs.map((r) => [r.gameId, r.rank, r.levelsCompleted, r.totalLevels]).sort()).toEqual([
      ['blockly-maze', 2, 10, 10],
      ['blockly-turtle', null, 1, 10],
    ]);
  });

  it('kidCard: chỉ xem được bạn đã có tên trên bảng; còn lại 404', async () => {
    users.findById.mockReturnValue({
      select: () => ({ lean: jest.fn().mockResolvedValue({ fullName: 'Lê Thị Bình', avatar: 'a.png', ageGroup: '3-5' }) }),
    });
    const card = await service.kidCard(OID(2));
    expect(card).toMatchObject({ fullName: 'Lê Thị Bình', ageGroup: '3-5' });
    expect(card.completedSlugs).toHaveLength(10);
    await expect(service.kidCard(OID(3))).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.kidCard('khong-hop-le')).rejects.toBeInstanceOf(NotFoundException);
  });
});
