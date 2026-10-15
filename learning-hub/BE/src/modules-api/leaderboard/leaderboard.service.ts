import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import {
  ContestAttempt,
  ContestAttemptDocument,
} from '../../modules-system/database/schemas/contest-attempt.schema';
import {
  Contest,
  ContestDocument,
} from '../../modules-system/database/schemas/contest.schema';
import {
  ContestSubmission,
  ContestSubmissionDocument,
} from '../../modules-system/database/schemas/contest-submission.schema';

export const PENALTY_MINUTES_PER_WRONG_ATTEMPT = 20;
/** Đóng băng bảng xếp hạng công khai trong 60 phút cuối của cuộc thi (chuẩn ICPC). */
export const DEFAULT_FREEZE_MINUTES = 60;

/** Họ tên hiển thị sạch: bỏ đuôi ObjectId/hash bị nối vào tên (vd "An (6ad07c49e753d22e5ad2483d)"). */
export function cleanDisplayName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/\s*[([]?\s*[0-9a-fA-F]{24}\s*[)\]]?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface LeaderboardConfig {
  penaltyMinutesPerWrong: number;
  freezeMinutes: number;
  tieBreakOrder: string[];
  lateSubmitPolicy: string;
}

export interface LeaderboardRow {
  rank: number;
  studentId: string;
  studentName: string;
  totalScore: number;
  timeMinutes: number;
  penaltyMinutes: number;
  solvedCount: number;
}

export interface LeaderboardResult {
  contestId: string;
  computedStatus: 'UPCOMING' | 'ONGOING' | 'ENDED';
  isFrozen: boolean;
  serverTime: string;
  rows: LeaderboardRow[];
}

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(Contest.name)
    private readonly contestModel: Model<ContestDocument>,
    @InjectModel(ContestSubmission.name)
    private readonly contestSubmissionModel: Model<ContestSubmissionDocument>,
    // Tên lấy trực tiếp từ User (đổi tên là bảng xếp hạng đổi theo, không cache) và giờ vào thi riêng của từng thí sinh.
    @Optional() @InjectModel(User.name) private readonly userModel?: Model<UserDocument>,
    @Optional() @InjectModel(ContestAttempt.name) private readonly attemptModel?: Model<ContestAttemptDocument>,
  ) {}

  private async findContestOrThrow(id: string): Promise<ContestDocument> {
    const contest = await this.contestModel
      .findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }],
      })
      .exec();
    if (!contest) {
      throw new NotFoundException(
        `Không tìm thấy cuộc thi với ID hoặc slug: ${id}`,
      );
    }
    return contest;
  }

  getConfig(
    contest: Pick<Contest, 'durationMinutes' | 'freezeMinutes'>,
  ): LeaderboardConfig {
    const freezeMinutes =
      contest.freezeMinutes && contest.freezeMinutes > 0
        ? contest.freezeMinutes
        : DEFAULT_FREEZE_MINUTES;

    return {
      penaltyMinutesPerWrong: PENALTY_MINUTES_PER_WRONG_ATTEMPT,
      freezeMinutes,
      tieBreakOrder: [
        'totalScore desc',
        '(timeMinutes + penaltyMinutes) asc',
        'studentId asc',
      ],
      lateSubmitPolicy:
        'Bài nộp sau thời gian kết thúc cuộc thi (theo giờ máy chủ) bị từ chối tính điểm, nhưng vẫn được ghi log để đối soát.',
    };
  }

  private computeStatus(
    startTime: Date,
    endTime: Date,
    now: Date,
  ): 'UPCOMING' | 'ONGOING' | 'ENDED' {
    if (now < startTime) return 'UPCOMING';
    if (now > endTime) return 'ENDED';
    return 'ONGOING';
  }

  async getRules(contestId: string) {
    const contest = await this.findContestOrThrow(contestId);
    return this.getConfig(contest);
  }

  async computeLeaderboard(
    contestId: string,
    opts: { asTeacher?: boolean } = {},
  ): Promise<LeaderboardResult> {
    const contest = await this.findContestOrThrow(contestId);
    const now = new Date();
    const status = this.computeStatus(contest.startTime, contest.endTime, now);
    const { freezeMinutes } = this.getConfig(contest);

    const freezeAt = new Date(
      contest.endTime.getTime() - freezeMinutes * 60_000,
    );
    const isFrozen = !opts.asTeacher && status === 'ONGOING' && now >= freezeAt;
    const cutoff = isFrozen ? freezeAt : now;

    const submissions = await this.contestSubmissionModel
      .find({
        contestId: String(contest._id),
        isLate: false,
        submittedAt: { $lte: cutoff },
      })
      .sort({ submittedAt: 1 })
      .lean();

    const problemMaxPoints = new Map<string, number>();
    for (const p of contest.problems) problemMaxPoints.set(p.slug, p.points);

    // Group by (studentId, problemSlug) to find each student's best (max-score) attempt per problem.
    type Key = string;
    const byStudentProblem = new Map<Key, ContestSubmissionDocument[]>();
    for (const s of submissions) {
      const key = `${s.studentId}::${s.problemSlug}`;
      const arr = byStudentProblem.get(key) ?? [];
      arr.push(s as ContestSubmissionDocument);
      byStudentProblem.set(key, arr);
    }

    interface StudentAgg {
      studentId: string;
      studentName: string;
      totalScore: number;
      timeMinutes: number;
      penaltyMinutes: number;
      solvedCount: number;
    }
    const students = new Map<string, StudentAgg>();

    // Mốc bắt đầu của từng thí sinh: giờ vào thi của họ; chưa có lượt thi thì tính từ giờ mở cuộc thi.
    const attemptRows: any[] = this.attemptModel
      ? await this.attemptModel.find({ contestId: String(contest._id) }).select('studentId startedAt').lean()
      : [];
    const startByStudent = new Map<string, number>();
    for (const a of attemptRows) {
      if (a.startedAt) startByStudent.set(String(a.studentId), new Date(a.startedAt).getTime());
    }
    const contestStartMs = contest.startTime.getTime();

    for (const [key, attempts] of byStudentProblem.entries()) {
      const [studentId, problemSlug] = key.split('::');
      const maxPoints = problemMaxPoints.get(problemSlug) ?? 0;

      // attempts already sorted by submittedAt asc (from the query sort above).
      const bestScore = Math.max(...attempts.map((a) => a.score));
      const bestAttempt = attempts.find((a) => a.score === bestScore)!; // earliest among max-score attempts

      const agg = students.get(studentId) ?? {
        studentId,
        studentName: bestAttempt.studentName || 'Học viên',
        totalScore: 0,
        timeMinutes: 0,
        penaltyMinutes: 0,
        solvedCount: 0,
      };

      agg.totalScore += bestScore;

      const isFullSolve = maxPoints > 0 && bestScore === maxPoints;
      if (isFullSolve) {
        agg.solvedCount += 1;
        const studentStartMs = startByStudent.get(studentId) ?? contestStartMs;
        agg.timeMinutes += Math.max(
          0,
          (bestAttempt.submittedAt.getTime() - studentStartMs) / 60_000,
        );
        const priorWrongAttempts = attempts.filter(
          (a) => a.submittedAt.getTime() < bestAttempt.submittedAt.getTime(),
        ).length;
        agg.penaltyMinutes +=
          priorWrongAttempts * PENALTY_MINUTES_PER_WRONG_ATTEMPT;
      }

      students.set(studentId, agg);
    }

    // Họ tên mới nhất từ User (không dùng bản chụp lúc nộp bài); thiếu thì dùng bản chụp đã làm sạch.
    const liveNames = new Map<string, string>();
    if (this.userModel && students.size > 0) {
      const ids = [...students.keys()].filter((id) => isValidObjectId(id));
      const users: any[] = ids.length
        ? await this.userModel.find({ _id: { $in: ids } }).select('fullName').lean()
        : [];
      for (const u of users) liveNames.set(String(u._id), cleanDisplayName(u.fullName));
    }
    for (const s of students.values()) {
      s.studentName = liveNames.get(s.studentId) || cleanDisplayName(s.studentName) || 'Học viên';
    }

    const rows = Array.from(students.values())
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        const aTie = a.timeMinutes + a.penaltyMinutes;
        const bTie = b.timeMinutes + b.penaltyMinutes;
        if (aTie !== bTie) return aTie - bTie;
        return a.studentId.localeCompare(b.studentId);
      })
      .map((s, idx) => ({
        rank: idx + 1,
        studentId: s.studentId,
        studentName: s.studentName,
        totalScore: Math.round(s.totalScore),
        timeMinutes: Math.round(s.timeMinutes),
        penaltyMinutes: s.penaltyMinutes,
        solvedCount: s.solvedCount,
      }));

    return {
      contestId: String(contest._id),
      computedStatus: status,
      isFrozen,
      serverTime: now.toISOString(),
      rows,
    };
  }
}
