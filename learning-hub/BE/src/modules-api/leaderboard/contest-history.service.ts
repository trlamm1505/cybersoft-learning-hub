import { Controller, Get, Injectable, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { Contest, ContestDocument } from '../../modules-system/database/schemas/contest.schema';
import {
  ContestSubmission,
  ContestSubmissionDocument,
} from '../../modules-system/database/schemas/contest-submission.schema';
import {
  ContestAttempt,
  ContestAttemptDocument,
} from '../../modules-system/database/schemas/contest-attempt.schema';
import { LeaderboardService } from './leaderboard.service';

const MAX_HISTORY = 20;

export interface ContestHistoryRow {
  contestId: string;
  title: string;
  /** Ngày vào thi (giờ bắt đầu lượt thi; chưa có lượt thì là lần nộp đầu). */
  joinedAt: Date;
  score: number;
  maxScore: number;
  /** Thời gian làm bài (phút), null nếu không xác định. */
  durationMinutes: number | null;
  /** Hạng chung cuộc / tổng số thí sinh có điểm trên bảng xếp hạng; null nếu không có trên bảng. */
  rank: number | null;
  totalParticipants: number;
  /** Bảng xếp hạng còn đang đóng băng/cuộc thi chưa kết thúc: hạng có thể còn đổi. */
  provisional: boolean;
  /** Giảng viên không công nhận kết quả: học viên vẫn thấy điểm của mình nhưng không có hạng chính thức. */
  disqualified: boolean;
  disqualifiedReason: string | null;
}

export function durationMinutesOf(start: Date | undefined, end: Date | undefined): number | null {
  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  return ms >= 0 ? Math.max(1, Math.round(ms / 60_000)) : null;
}

/** Lịch sử cuộc thi của CHÍNH học viên (userId từ JWT): mọi cuộc thi đã nộp bài, kèm điểm, thời gian và hạng. */
@Injectable()
export class ContestHistoryService {
  constructor(
    @InjectModel(Contest.name) private readonly contests: Model<ContestDocument>,
    @InjectModel(ContestSubmission.name) private readonly submissions: Model<ContestSubmissionDocument>,
    @InjectModel(ContestAttempt.name) private readonly attempts: Model<ContestAttemptDocument>,
    private readonly leaderboard: LeaderboardService,
  ) {}

  /** Tổng điểm tốt nhất mỗi đề của chính học viên (dùng khi không còn trên bảng xếp hạng chính thức). */
  private async ownScore(contestId: string, userId: string): Promise<number> {
    const subs: any[] = await this.submissions.find({ contestId, studentId: userId, isLate: false }).select('problemSlug score').lean();
    const best = new Map<string, number>();
    for (const s of subs) best.set(s.problemSlug, Math.max(best.get(s.problemSlug) ?? 0, s.score ?? 0));
    return Math.round([...best.values()].reduce((a, b) => a + b, 0));
  }

  async myHistory(userId: string): Promise<ContestHistoryRow[]> {
    const subs: any[] = await this.submissions
      .find({ studentId: userId })
      .select('contestId submittedAt')
      .sort({ submittedAt: 1 })
      .lean();
    if (subs.length === 0) return [];

    const firstSubmit = new Map<string, Date>();
    const lastSubmit = new Map<string, Date>();
    for (const s of subs) {
      if (!firstSubmit.has(s.contestId)) firstSubmit.set(s.contestId, s.submittedAt);
      lastSubmit.set(s.contestId, s.submittedAt);
    }
    const contestIds = [...firstSubmit.keys()].filter(isValidObjectId);
    if (contestIds.length === 0) return [];

    const [contests, attempts]: [any[], any[]] = await Promise.all([
      this.contests.find({ _id: { $in: contestIds } }).select('title problems startTime').lean(),
      this.attempts.find({ studentId: userId, contestId: { $in: contestIds } }).lean(),
    ]);
    const attemptBy = new Map(attempts.map((a) => [a.contestId, a]));

    const rows: ContestHistoryRow[] = [];
    for (const c of contests) {
      const id = String(c._id);
      const lb = await this.leaderboard.computeLeaderboard(id);
      const attempt = attemptBy.get(id);
      const isDq = attempt?.disqualified === true;
      const mine = lb.rows.find((r) => r.studentId === userId);
      // Bị không công nhận thì không còn trên bảng chính thức: điểm cá nhân tính lại từ bài nộp của chính họ.
      const ownScore = isDq ? await this.ownScore(id, userId) : null;
      const joinedAt: Date = attempt?.startedAt ?? firstSubmit.get(id)!;
      const duration =
        durationMinutesOf(attempt?.startedAt, attempt?.finishedAt ?? lastSubmit.get(id)) ??
        (mine ? mine.timeMinutes + mine.penaltyMinutes || null : null);
      rows.push({
        contestId: id,
        title: c.title,
        joinedAt,
        score: isDq ? (ownScore ?? 0) : (mine?.totalScore ?? 0),
        maxScore: (c.problems ?? []).reduce((s: number, p: { points: number }) => s + (p.points ?? 0), 0),
        durationMinutes: duration,
        rank: isDq ? null : (mine?.rank ?? null),
        totalParticipants: lb.rows.length,
        provisional: lb.computedStatus !== 'ENDED' || lb.isFrozen,
        disqualified: isDq,
        disqualifiedReason: isDq ? (attempt?.disqualifiedReason ?? null) : null,
      });
    }
    return rows.sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime()).slice(0, MAX_HISTORY);
  }
}

@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class StudentContestHistoryController {
  constructor(private readonly service: ContestHistoryService) {}

  /** GET /api/student/contest-history — chỉ dữ liệu của học viên đang đăng nhập. */
  @Get('contest-history')
  history(@CurrentUser() user: JwtPayload) {
    return this.service.myHistory(user.sub);
  }
}
