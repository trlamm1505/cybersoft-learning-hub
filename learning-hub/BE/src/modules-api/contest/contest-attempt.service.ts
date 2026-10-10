import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Contest,
  ContestDocument,
} from '../../modules-system/database/schemas/contest.schema';
import {
  ContestAttempt,
  ContestAttemptDocument,
  ContestIntegrity,
} from '../../modules-system/database/schemas/contest-attempt.schema';
import {
  ContestSubmission,
  ContestSubmissionDocument,
} from '../../modules-system/database/schemas/contest-submission.schema';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import { findBestMatch } from '../integrity/code-similarity';
import {
  buildIntegritySignals,
  ClientIntegrityPayload,
} from '../integrity/integrity-signals';
import { INTEGRITY_CONFIG } from '../integrity/integrity.config';
import { ContestService, ContestViewer } from './contest.service';

/** Cho phép trễ chút do mạng khi nộp đúng lúc hết giờ cá nhân. */
export const ATTEMPT_GRACE_MS = 5_000;

export interface SimilarityHit {
  score: number;
  submissionId?: string;
  userId?: string;
  problemSlug?: string;
}

/**
 * Lượt thi cá nhân: đồng hồ do máy chủ giữ, mỗi học viên một lượt, và nơi lưu
 * tín hiệu liêm chính của lượt thi. Tín hiệu chỉ để giảng viên xem xét, không
 * bao giờ đổi điểm hay chặn nộp bài.
 */
@Injectable()
export class ContestAttemptService {
  constructor(
    @InjectModel(Contest.name)
    private readonly contestModel: Model<ContestDocument>,
    @InjectModel(ContestAttempt.name)
    private readonly attemptModel: Model<ContestAttemptDocument>,
    @InjectModel(ContestSubmission.name)
    private readonly submissionModel: Model<ContestSubmissionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly contestService: ContestService,
  ) {}

  private assertRegistered(contest: ContestDocument, studentId: string) {
    const registered = (contest.registrations ?? []).some(
      (r) => r.studentId === studentId,
    );
    if (!registered) {
      throw new ForbiddenException(
        'Bạn chưa đăng ký cuộc thi này nên không thể xem đề hay nộp bài.',
      );
    }
  }

  private toView(
    attempt: ContestAttempt,
    contest: ContestDocument,
    now = new Date(),
  ) {
    return {
      startedAt: attempt.startedAt.toISOString(),
      deadlineAt: attempt.deadlineAt.toISOString(),
      finishedAt: attempt.finishedAt?.toISOString() ?? null,
      finishReason: attempt.finishReason ?? null,
      serverTime: now.toISOString(),
      durationMinutes: contest.durationMinutes,
      integrityEnabled: contest.integrityEnabled !== false,
    };
  }

  /** Bắt đầu (hoặc lấy lại) lượt thi. Gọi nhiều lần vẫn một lượt, giữ nguyên giờ bắt đầu. */
  async start(contestId: string, student: ContestViewer) {
    const contest = await this.contestService.findVisible(contestId, student);
    this.assertRegistered(contest, student.sub);

    const key = { contestId: String(contest._id), studentId: student.sub };
    const existing = await this.attemptModel.findOne(key).lean();
    if (existing) return this.toView(existing as ContestAttempt, contest);

    const now = new Date();
    if (now < contest.startTime) {
      throw new BadRequestException('Cuộc thi chưa bắt đầu. Chưa thể vào thi.');
    }
    if (now > contest.endTime) {
      throw new BadRequestException('Cuộc thi đã kết thúc. Không thể vào thi.');
    }

    const user = await this.userModel
      .findById(student.sub)
      .select('fullName')
      .lean();
    const deadlineAt = new Date(
      Math.min(
        now.getTime() + (contest.durationMinutes || 90) * 60_000,
        contest.endTime.getTime(),
      ),
    );
    try {
      const created = await this.attemptModel.create({
        ...key,
        studentName: user?.fullName || 'Học viên',
        startedAt: now,
        deadlineAt,
      });
      return this.toView(created.toObject() as ContestAttempt, contest, now);
    } catch (err: any) {
      // Hai request vào thi cùng lúc: bản ghi thứ hai đụng chỉ mục unique, dùng bản đã có.
      if (err?.code === 11000) {
        const again = await this.attemptModel.findOne(key).lean();
        if (again) return this.toView(again as ContestAttempt, contest);
      }
      throw err;
    }
  }

  /** Lượt thi đang mở (chưa nộp, chưa quá giờ cá nhân); ném lỗi nếu không. */
  async requireActive(
    contest: ContestDocument,
    studentId: string,
    now: Date,
  ): Promise<ContestAttemptDocument> {
    const attempt = await this.attemptModel.findOne({
      contestId: String(contest._id),
      studentId,
    });
    if (!attempt) {
      throw new BadRequestException(
        'Bạn chưa bắt đầu làm bài thi. Hãy bấm "Vào thi" trước.',
      );
    }
    if (attempt.finishedAt) {
      throw new BadRequestException(
        'Bạn đã nộp bài thi nên không thể xem đề hoặc nộp thêm.',
      );
    }
    if (now.getTime() > attempt.deadlineAt.getTime() + ATTEMPT_GRACE_MS) {
      throw new BadRequestException(
        'Đã hết thời gian làm bài của bạn.',
      );
    }
    return attempt;
  }

  async findAttempt(contestId: string, studentId: string) {
    return this.attemptModel.findOne({ contestId, studentId });
  }

  /** Kết quả từng đề của chính học viên (lấy từ log bài nộp, không tin client). */
  async getMine(contestId: string, student: ContestViewer) {
    const contest = await this.contestService.findVisible(contestId, student);
    this.assertRegistered(contest, student.sub);
    const attempt = await this.attemptModel
      .findOne({ contestId: String(contest._id), studentId: student.sub })
      .lean();
    if (!attempt) return { attempt: null, results: [], totalScore: 0, maxScore: 0 };

    const now = new Date();
    const contestOver = now > contest.endTime;
    const subs = await this.submissionModel
      .find({
        contestId: String(contest._id),
        studentId: student.sub,
        isLate: false,
      })
      .sort({ submittedAt: 1 })
      .lean();

    const best = new Map<string, any>();
    for (const s of subs) {
      const cur = best.get(s.problemSlug);
      if (!cur || s.score > cur.score) best.set(s.problemSlug, s);
    }

    let totalScore = 0;
    let scoreHidden = false;
    const results = (contest.problems ?? []).map((p) => {
      const s = best.get(p.slug);
      const hidden = !!s && p.type === 'quiz' && !contestOver;
      if (hidden) scoreHidden = true;
      else if (s) totalScore += s.score;
      return {
        slug: p.slug,
        title: p.title,
        type: p.type,
        maxPoints: p.points,
        submitted: !!s,
        // Quiz chấm ngay nhưng chỉ công bố khi cuộc thi kết thúc, tránh dò đáp án.
        resultHidden: hidden,
        score: s && !hidden ? s.score : null,
        verdict: s && !hidden ? s.verdict : null,
        passedCount: s && !hidden ? s.passedCount : null,
        totalCount: s ? s.totalCount : null,
        submittedAt: s ? s.submittedAt : null,
      };
    });
    const maxScore = (contest.problems ?? []).reduce((a, p) => a + p.points, 0);

    return {
      attempt: this.toView(attempt as ContestAttempt, contest, now),
      results,
      totalScore,
      maxScore,
      scoreHidden,
    };
  }

  /** Nộp bài thi (kết thúc lượt). Gọi lại thì trả kết quả cũ, không đổi giờ nộp. */
  async finish(
    contestId: string,
    student: ContestViewer,
    payload?: ClientIntegrityPayload,
  ) {
    const contest = await this.contestService.findVisible(contestId, student);
    this.assertRegistered(contest, student.sub);
    const attempt = await this.attemptModel.findOne({
      contestId: String(contest._id),
      studentId: student.sub,
    });
    if (!attempt) {
      throw new BadRequestException('Bạn chưa bắt đầu làm bài thi.');
    }
    if (!attempt.finishedAt) {
      const now = new Date();
      if (contest.integrityEnabled !== false && payload) {
        await this.recordIntegrity(contest, attempt, payload, null, now);
      }
      const timedOut = now.getTime() >= attempt.deadlineAt.getTime() - 1000;
      await this.attemptModel.updateOne(
        { _id: attempt._id, finishedAt: { $exists: false } },
        {
          $set: {
            finishedAt: now,
            finishReason: timedOut ? 'TIMEOUT' : 'MANUAL',
          },
        },
      );
    }
    return this.getMine(contestId, student);
  }

  /**
   * Bài giống nhất của học viên KHÁC trong cùng đề của cùng cuộc thi. Mỗi học
   * viên chỉ tính bài nộp mới nhất để một người nộp nhiều lần không lấn hết
   * số lượt so khớp.
   */
  async similarityFor(
    contestId: string,
    problemSlug: string,
    studentId: string,
    code: string,
    starterCode: string,
  ): Promise<SimilarityHit> {
    const others = await this.submissionModel
      .find({
        contestId,
        problemSlug,
        problemType: 'coding',
        studentId: { $ne: studentId },
        isLate: false,
      })
      .select('studentId code')
      .sort({ submittedAt: -1 })
      .limit(INTEGRITY_CONFIG.maxComparisons * 5)
      .lean();
    const latestPerStudent = new Map<string, { id: string; userId: string; code: string }>();
    for (const o of others as any[]) {
      if (!o.code || latestPerStudent.has(o.studentId)) continue;
      latestPerStudent.set(o.studentId, {
        id: String(o._id),
        userId: o.studentId,
        code: o.code,
      });
    }
    const match = findBestMatch(
      code,
      starterCode,
      [...latestPerStudent.values()],
      studentId,
    );
    return {
      score: match.score,
      submissionId: match.submissionId,
      userId: match.userId,
      problemSlug,
    };
  }

  /**
   * Gộp tín hiệu mới vào lượt thi: giữ điểm tương đồng cao nhất qua mọi đề,
   * lấy dữ liệu rời màn hình/chỉnh sửa mới nhất từ client (tích lũy), còn giờ
   * bắt đầu luôn lấy từ máy chủ. Kết luận của giảng viên (nếu đã duyệt) được giữ nguyên.
   */
  async recordIntegrity(
    contest: ContestDocument,
    attempt: ContestAttemptDocument,
    payload: ClientIntegrityPayload | undefined,
    similarity: SimilarityHit | null,
    now: Date,
  ): Promise<void> {
    if (contest.integrityEnabled === false) return;
    const prev = attempt.integrity as ContestIntegrity | undefined;

    const keepPrev = !similarity || similarity.score <= (prev?.similarity.score ?? 0);
    const best: SimilarityHit = keepPrev
      ? {
          score: prev?.similarity.score ?? 0,
          submissionId: prev?.similarity.matchedSubmissionId,
          userId: prev?.similarity.matchedUserId,
          problemSlug: prev?.similarityProblemSlug,
        }
      : similarity!;

    const iso = (d: Date) => d.toISOString();
    const effectivePayload: ClientIntegrityPayload = {
      startedAt: iso(attempt.startedAt),
      focusEvents:
        payload?.focusEvents ??
        prev?.focusEvents.map((e) => ({
          leftAt: iso(new Date(e.leftAt)),
          returnedAt: iso(new Date(e.returnedAt)),
        })),
      editMarks:
        payload?.editMarks ??
        prev?.timeline.editMarks.map((m) => ({
          at: iso(new Date(m.at)),
          charCount: m.charCount,
        })),
    };

    const signals = buildIntegritySignals(
      effectivePayload,
      {
        score: best.score,
        submissionId: best.submissionId,
        userId: best.userId,
      },
      now,
    );
    const next: ContestIntegrity = {
      ...signals,
      similarityProblemSlug: best.problemSlug,
    };
    if (prev?.reviewStatus === 'REVIEWED') {
      next.reviewStatus = 'REVIEWED';
      next.decision = prev.decision;
      next.reviewNote = prev.reviewNote;
      next.reviewedBy = prev.reviewedBy;
      next.reviewedAt = prev.reviewedAt;
    }
    await this.attemptModel.updateOne(
      { _id: attempt._id },
      { $set: { integrity: next } },
    );
  }
}
