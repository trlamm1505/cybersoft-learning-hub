import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  BlockPuzzleProgress,
  BlockPuzzleProgressDocument,
} from '../../modules-system/database/schemas/block-puzzle-progress.schema';
import { Lesson, LessonDocument } from '../../modules-system/database/schemas/lesson.schema';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { BUILTIN_GAME_SLUGS, buildGameSlugs } from './block-puzzle-games';
import { minCompletionTimeSec, minTotalSpanMs, rankStandings, type Standing } from './block-puzzle-standings';

const LEADERBOARD_SIZE = 10;
/** Bảng xếp hạng gom cả collection tiến độ nên giữ kết quả vài giây; markCompleted xóa cache để bảng luôn thấy thành tích mới. */
const STANDINGS_TTL_MS = 5_000;

interface StandingsResult {
  byGame: Map<string, Standing[]>;
  totals: Map<string, number>;
  names: Map<string, string>;
  slugsByUser: Map<string, string[]>;
}

@Injectable()
export class BlockPuzzleService {
  constructor(
    @InjectModel(BlockPuzzleProgress.name)
    private readonly progressModel: Model<BlockPuzzleProgressDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
  ) {}

  /**
   * Trả về danh sách slug các bài Block Puzzle mà user này đã hoàn thành —
   * dùng để tính sequential-unlock ("ải") ở phía FE, thay cho localStorage.
   */
  async getCompletedSlugs(userId: string): Promise<string[]> {
    const rows = await this.progressModel
      .find({ userId })
      .select('lessonSlug')
      .lean();
    return rows.map((r) => r.lessonSlug);
  }

  private standingsCache?: { at: number; value: Promise<StandingsResult> };

  private standings(): Promise<StandingsResult> {
    const now = Date.now();
    if (!this.standingsCache || now - this.standingsCache.at > STANDINGS_TTL_MS) {
      const value = this.computeStandings();
      // Lỗi thì không giữ lại trong cache.
      value.catch(() => {
        this.standingsCache = undefined;
      });
      this.standingsCache = { at: now, value };
    }
    return this.standingsCache.value;
  }

  /**
   * Xếp hạng mọi game. Mỗi (game, bé) chỉ tính các màn HỢP LỆ của game đó (slug có thật), nên gửi slug giả
   * không làm tăng số màn. Chỉ tài khoản STUDENT; bé chưa phá đảo 100% có rank = null (không lên bảng).
   */
  private async computeStandings(): Promise<StandingsResult> {
    const lessons = await this.lessonModel
      .find({ type: 'block' })
      .select('slug status blockPuzzle.gameId')
      .lean();
    const gameSlugs = buildGameSlugs(lessons as never);
    const totals = new Map([...gameSlugs].map(([id, set]) => [id, set.size]));

    const groups = await this.progressModel.aggregate<{
      _id: { g: string; u: string };
      items: Array<{ s: string; at: Date }>;
    }>([
      {
        $group: {
          _id: { g: '$gameId', u: '$userId' },
          items: { $push: { s: '$lessonSlug', at: '$completedAt' } },
        },
      },
    ]);

    const ids = [...new Set(groups.map((g) => g._id.u))].filter((id) =>
      isValidObjectId(id),
    );
    const students = await this.userModel
      .find({ _id: { $in: ids }, role: 'STUDENT' })
      .select('fullName')
      .lean();
    const names = new Map(students.map((s) => [String(s._id), s.fullName ?? '']));

    const perGame = new Map<string, Parameters<typeof rankStandings>[0]>();
    const slugsByUser = new Map<string, string[]>();
    for (const g of groups) {
      const allowed = gameSlugs.get(g._id.g);
      if (!allowed || !names.has(g._id.u)) continue;
      const valid = g.items.filter((i) => allowed.has(i.s));
      if (valid.length === 0) continue;
      const times = valid.map((i) => new Date(i.at).getTime());
      const list = perGame.get(g._id.g) ?? [];
      list.push({
        gameId: g._id.g,
        userId: g._id.u,
        levelsCompleted: valid.length,
        firstCompletedAt: new Date(Math.min(...times)),
        lastCompletedAt: new Date(Math.max(...times)),
      });
      perGame.set(g._id.g, list);
      slugsByUser.set(g._id.u, [...(slugsByUser.get(g._id.u) ?? []), ...valid.map((i) => i.s)]);
    }
    const byGame = new Map<string, Standing[]>();
    for (const [gameId, rows] of perGame) {
      const total = totals.get(gameId) ?? 0;
      byGame.set(gameId, rankStandings(rows, total, minTotalSpanMs(total)));
    }
    return { byGame, totals, names, slugsByUser };
  }

  /**
   * Bảng vinh danh một game: top 10 bé ĐÃ PHÁ ĐẢO 100%, xếp theo tổng thời gian chơi (ngắn hơn = hạng cao hơn). Kèm họ tên đầy đủ để hiển thị,
   * không có email. Nếu người xem chưa phá đảo thì trả `myProgress` để báo còn bao nhiêu màn.
   */
  async leaderboard(gameId: string, viewerId: string, limit = LEADERBOARD_SIZE) {
    const { byGame, totals, names } = await this.standings();
    const totalLevels = totals.get(gameId) ?? 0;
    const all = byGame.get(gameId) ?? [];
    const ranked = all.filter((s) => s.rank !== null);
    const toRow = (s: Standing) => ({
      rank: s.rank as number,
      userId: s.userId,
      fullName: names.get(s.userId) ?? 'Bé',
      levelsCompleted: s.levelsCompleted,
      totalLevels,
      firstCompletedAt: s.firstCompletedAt,
      lastCompletedAt: s.lastCompletedAt,
      isMe: s.userId === viewerId,
    });
    const mine = all.find((s) => s.userId === viewerId);
    return {
      gameId,
      totalLevels,
      total: ranked.length,
      top: ranked.slice(0, limit).map(toRow),
      me: mine && mine.rank !== null && mine.rank > limit ? toRow(mine) : undefined,
      myProgress: mine && mine.rank === null ? { levelsCompleted: mine.levelsCompleted, totalLevels } : undefined,
    };
  }

  /** Kỷ lục cá nhân: mỗi game bé đã chơi, hạng (null nếu chưa phá đảo), số màn hợp lệ và mốc thời gian đầu/cuối. */
  async records(userId: string) {
    const { byGame, totals } = await this.standings();
    const out: Array<{
      gameId: string;
      rank: number | null;
      levelsCompleted: number;
      totalLevels: number;
      firstCompletedAt: Date;
      lastCompletedAt: Date;
    }> = [];
    for (const [gameId, rows] of byGame) {
      const mine = rows.find((r) => r.userId === userId);
      if (mine) {
        out.push({
          gameId,
          rank: mine.rank,
          levelsCompleted: mine.levelsCompleted,
          totalLevels: totals.get(gameId) ?? 0,
          firstCompletedAt: mine.firstCompletedAt,
          lastCompletedAt: mine.lastCompletedAt,
        });
      }
    }
    return out;
  }

  /**
   * Thẻ thông tin một bạn trên bảng vinh danh (avatar, họ tên, khối lớp, các màn đã xong để FE tính sao/huy hiệu).
   * Chỉ xem được bạn đang có tên trên ít nhất một bảng xếp hạng; không lộ email hay thông tin liên hệ.
   */
  async kidCard(targetId: string) {
    const { byGame, slugsByUser } = await this.standings();
    const onBoard = [...byGame.values()].some((rows) =>
      rows.some((r) => r.userId === targetId && r.rank !== null),
    );
    if (!onBoard || !isValidObjectId(targetId)) {
      throw new NotFoundException('Không tìm thấy bạn này trên bảng vinh danh.');
    }
    const user = await this.userModel
      .findById(targetId)
      .select('fullName avatar ageGroup')
      .lean();
    if (!user) throw new NotFoundException('Không tìm thấy bạn này trên bảng vinh danh.');
    return {
      userId: targetId,
      fullName: user.fullName,
      avatar: user.avatar ?? null,
      ageGroup: user.ageGroup ?? null,
      completedSlugs: slugsByUser.get(targetId) ?? [],
    };
  }

  /**
   * Đánh dấu một bài đã hoàn thành cho user hiện tại. Idempotent: hoàn thành
   * lại một bài đã xong trước đó không tạo bản ghi trùng (nhờ unique index
   * trên (userId, lessonSlug)) và không lỗi — chỉ trả về bản ghi đã có.
   */
  async markCompleted(userId: string, dto: CompleteLessonDto) {
    const { lessonSlug, gameId } = dto ?? ({} as CompleteLessonDto);
    if (typeof lessonSlug !== 'string' || typeof gameId !== 'string' || !lessonSlug || !gameId) {
      throw new BadRequestException('Thiếu lessonSlug hoặc gameId.');
    }

    // Slug phải thật sự thuộc game đó (chặn gửi slug/gameId bịa để chen vào bảng vinh danh).
    const lessons = await this.lessonModel.find({ type: 'block' }).select('slug status blockPuzzle.gameId').lean();
    const allowed = buildGameSlugs(lessons as never).get(gameId);
    if (!allowed || !allowed.has(lessonSlug)) {
      throw new BadRequestException('Màn chơi không hợp lệ.');
    }

    // Game dựng sẵn mở khóa tuần tự (màn n chỉ chơi được khi đã xong màn n-1), nên server cũng đòi đúng thứ tự.
    const order = BUILTIN_GAME_SLUGS[gameId];
    const idx = order ? order.indexOf(lessonSlug) : -1;
    if (idx > 0) {
      const prev = await this.progressModel.findOne({ userId, lessonSlug: order[idx - 1] }).lean();
      if (!prev) throw new BadRequestException('Hãy hoàn thành màn trước đã.');
    }

    const existing = await this.progressModel.findOne({ userId, lessonSlug }).lean();
    if (existing) {
      return { alreadyCompleted: true, completedAt: existing.completedAt };
    }

    // Chống gửi tự động: hai lần hoàn thành màn trong cùng một game phải cách nhau tối thiểu minCompletionTimeSec.
    const minSec = minCompletionTimeSec();
    if (minSec > 0) {
      const last = await this.progressModel.findOne({ userId, gameId }).sort({ completedAt: -1 }).lean();
      if (last && Date.now() - new Date(last.completedAt).getTime() < minSec * 1000) {
        throw new BadRequestException('Thao tác quá nhanh, vui lòng tự giải đố nhé!');
      }
    }

    const created = await this.progressModel.create({
      userId,
      lessonSlug,
      gameId,
      completedAt: new Date(),
    });

    this.standingsCache = undefined; // bảng vinh danh phải thấy thành tích vừa lưu
    return { alreadyCompleted: false, completedAt: created.completedAt };
  }
}
