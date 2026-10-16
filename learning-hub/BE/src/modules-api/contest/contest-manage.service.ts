import {
  Optional,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  ContestAttempt,
  ContestAttemptDocument,
} from '../../modules-system/database/schemas/contest-attempt.schema';
import {
  ContestSubmission,
  ContestSubmissionDocument,
} from '../../modules-system/database/schemas/contest-submission.schema';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import {
  Question,
  QuestionDocument,
} from '../../modules-system/database/schemas/question.schema';
import {
  User,
  UserDocument,
} from '../../modules-system/database/schemas/user.schema';
import type { IntegrityDecision } from '../../modules-system/database/schemas/submission.schema';
import { ContestService, ContestViewer } from './contest.service';
import { AuditLogService } from '../admin-portal/audit-log.service';
import { bandOfExercise, exerciseBandFilter, normalizeBankBand, questionBandFilter } from '../exercise/exercise-matrix';
import { INTEGRITY_DECISIONS } from '../integrity/integrity.service';
import type { IntegrityReviewInput } from '../integrity/integrity.service';

/** Từ lần rời màn hình thứ 3 giảng viên mới được bấm "Không công nhận kết quả". */
export const DISQUALIFY_MIN_LEAVES = 3;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Phần dành cho giảng viên: bảng kết quả theo thí sinh, xem xét tính trung
 * thực của lượt thi và ngân hàng đề để dựng cuộc thi. Giảng viên là người
 * quyết định cuối cùng; hệ thống không tự đổi điểm hay hủy bài.
 */
@Injectable()
export class ContestManageService {
  constructor(
    private readonly contestService: ContestService,
    @InjectModel(ContestAttempt.name)
    private readonly attemptModel: Model<ContestAttemptDocument>,
    @InjectModel(ContestSubmission.name)
    private readonly submissionModel: Model<ContestSubmissionDocument>,
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @Optional() private readonly audit?: AuditLogService,
  ) {}

  async getResults(id: string, requester: ContestViewer) {
    const contest = await this.contestService.getContestForStaff(id, requester);
    const contestId = String(contest._id);
    const now = new Date();

    const [attempts, subs] = await Promise.all([
      this.attemptModel.find({ contestId }).lean(),
      this.submissionModel
        .find({ contestId, isLate: false })
        .select('studentId problemSlug score verdict')
        .lean(),
    ]);
    const attemptByStudent = new Map(attempts.map((a) => [a.studentId, a]));
    const best = new Map<string, { score: number; verdict: string }>();
    for (const s of subs as any[]) {
      const key = `${s.studentId}::${s.problemSlug}`;
      const cur = best.get(key);
      if (!cur || s.score > cur.score) {
        best.set(key, { score: s.score, verdict: s.verdict });
      }
    }

    const problems = (contest.problems ?? []).map((p) => ({
      slug: p.slug,
      title: p.title,
      type: p.type,
      maxPoints: p.points,
    }));
    const maxScore = problems.reduce((sum, p) => sum + p.maxPoints, 0);

    const rows = (contest.registrations ?? []).map((r) => {
      const attempt: any = attemptByStudent.get(r.studentId);
      const perProblem = problems.map((p) => {
        const b = best.get(`${r.studentId}::${p.slug}`);
        return {
          slug: p.slug,
          score: b ? b.score : null,
          verdict: b ? b.verdict : null,
        };
      });
      const totalScore = perProblem.reduce((sum, p) => sum + (p.score ?? 0), 0);
      let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'FINISHED' | 'EXPIRED' =
        'NOT_STARTED';
      if (attempt) {
        status = attempt.finishedAt
          ? 'FINISHED'
          : now > new Date(attempt.deadlineAt)
            ? 'EXPIRED'
            : 'IN_PROGRESS';
      }
      const ig = attempt?.integrity;
      const leaveCount = attempt?.leaveCount ?? 0;
      const disqualified = attempt?.disqualified === true;
      return {
        leaveCount,
        disqualified,
        disqualifiedReason: disqualified ? (attempt.disqualifiedReason ?? null) : null,
        canDisqualify: !!attempt && !disqualified && leaveCount >= DISQUALIFY_MIN_LEAVES,
        completionMinutes: attempt?.startedAt && attempt?.finishedAt ? Math.max(1, Math.round((new Date(attempt.finishedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60_000)) : null,
        studentId: r.studentId,
        studentName: r.studentName || 'Học viên',
        registeredAt: r.registeredAt,
        attemptId: attempt ? String(attempt._id) : null,
        status,
        startedAt: attempt?.startedAt ?? null,
        finishedAt: attempt?.finishedAt ?? null,
        totalScore,
        perProblem,
        integrity: ig
          ? {
              flag: ig.flag,
              reviewStatus: ig.reviewStatus,
              decision: ig.decision ?? null,
              similarityScore: ig.similarity?.score ?? 0,
              focusCount: ig.focusSummary?.count ?? 0,
              awaySeconds: ig.focusSummary?.totalAwaySeconds ?? 0,
              activeSeconds: ig.timeline?.activeSeconds ?? 0,
            }
          : null,
      };
    });

    // Hạng chính thức: theo điểm giảm dần, cùng điểm thì làm nhanh hơn xếp trên; thí sinh bị không công nhận không có hạng.
    const ranked = rows
      .filter((r) => r.status !== 'NOT_STARTED' && !r.disqualified)
      .sort((a, b) => b.totalScore - a.totalScore || (a.completionMinutes ?? Infinity) - (b.completionMinutes ?? Infinity));
    const rankOf = new Map(ranked.map((r, i) => [r.studentId, i + 1]));
    const outRows = rows.map((r) => ({ ...r, officialRank: rankOf.get(r.studentId) ?? null }));

    return {
      contest: {
        id: contestId,
        slug: contest.slug,
        title: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime,
        durationMinutes: contest.durationMinutes,
        integrityEnabled: contest.integrityEnabled !== false,
        problems,
        maxScore,
      },
      summary: {
        registered: rows.length,
        started: rows.filter((r) => r.status !== 'NOT_STARTED').length,
        finished: rows.filter((r) => r.status === 'FINISHED').length,
        disqualified: rows.filter((r) => r.disqualified).length,
        needsReview: rows.filter(
          (r) => r.integrity?.reviewStatus === 'NEEDS_REVIEW',
        ).length,
      },
      rows: outRows,
    };
  }

  /** Giảng viên không công nhận kết quả (chỉ khi thí sinh rời màn hình từ 3 lần). Học viên vẫn xem được điểm của mình. */
  async disqualify(id: string, attemptId: string, reason: string, requester: ContestViewer) {
    const contest = await this.contestService.getContestForStaff(id, requester);
    const text = (reason ?? '').trim();
    if (text.length < 10) throw new BadRequestException('Cần nhập lý do không công nhận (ít nhất 10 ký tự).');
    const attempt = await this.findAttempt(String(contest._id), attemptId);
    if (attempt.disqualified === true) throw new BadRequestException('Kết quả này đã bị không công nhận.');
    if ((attempt.leaveCount ?? 0) < DISQUALIFY_MIN_LEAVES) {
      throw new BadRequestException({ code: 'E400_NOT_ENOUGH_LEAVES', message: `Chỉ không công nhận khi thí sinh rời màn hình từ ${DISQUALIFY_MIN_LEAVES} lần (hiện ${attempt.leaveCount ?? 0}).` });
    }
    const now = new Date();
    await this.attemptModel.updateOne({ _id: attemptId }, { $set: { disqualified: true, disqualifiedReason: text.slice(0, 500), disqualifiedBy: requester.sub, disqualifiedAt: now } });
    await this.audit?.record({ sub: requester.sub, email: (requester as { email?: string }).email ?? '' }, 'CONTEST_DISQUALIFY', 'CONTEST_ATTEMPT', attemptId, { disqualified: false }, { disqualified: true, contestId: String(contest._id), studentId: attempt.studentId, leaveCount: attempt.leaveCount }, text);
    return { id: attemptId, disqualified: true, disqualifiedAt: now };
  }

  /** Khôi phục kết quả đã bị không công nhận (giảng viên có thể rút lại quyết định). */
  async reinstate(id: string, attemptId: string, requester: ContestViewer) {
    const contest = await this.contestService.getContestForStaff(id, requester);
    const attempt = await this.findAttempt(String(contest._id), attemptId);
    if (attempt.disqualified !== true) throw new BadRequestException('Kết quả này đang được công nhận.');
    await this.attemptModel.updateOne({ _id: attemptId }, { $set: { disqualified: false }, $unset: { disqualifiedReason: '', disqualifiedBy: '', disqualifiedAt: '' } });
    await this.audit?.record({ sub: requester.sub, email: (requester as { email?: string }).email ?? '' }, 'CONTEST_REINSTATE', 'CONTEST_ATTEMPT', attemptId, { disqualified: true }, { disqualified: false, contestId: String(contest._id), studentId: attempt.studentId });
    return { id: attemptId, disqualified: false };
  }

  private async findAttempt(contestId: string, attemptId: string) {
    if (!isValidObjectId(attemptId)) throw new NotFoundException('Không tìm thấy lượt thi.');
    const attempt: any = await this.attemptModel.findById(attemptId).lean();
    if (!attempt || attempt.contestId !== contestId) throw new NotFoundException('Không tìm thấy lượt thi.');
    return attempt;
  }

  private async findAttemptOrThrow(contestId: string, attemptId: string) {
    if (!isValidObjectId(attemptId)) {
      throw new NotFoundException('Không tìm thấy lượt thi.');
    }
    const attempt: any = await this.attemptModel.findById(attemptId).lean();
    if (!attempt || attempt.contestId !== contestId || !attempt.integrity) {
      throw new NotFoundException('Không tìm thấy tín hiệu liêm chính của lượt thi này.');
    }
    return attempt;
  }

  /** Chi tiết một lượt thi: dòng thời gian, mã của bài tương đồng nhất và bài bị so khớp. */
  async getIntegrityDetail(
    id: string,
    attemptId: string,
    requester: ContestViewer,
  ) {
    const contest = await this.contestService.getContestForStaff(id, requester);
    const contestId = String(contest._id);
    const attempt = await this.findAttemptOrThrow(contestId, attemptId);
    const ig = attempt.integrity;

    const codingSlugs = (contest.problems ?? [])
      .filter((p) => p.type === 'coding')
      .map((p) => p.slug);
    const slug: string | undefined =
      ig.similarityProblemSlug && codingSlugs.includes(ig.similarityProblemSlug)
        ? ig.similarityProblemSlug
        : codingSlugs[0];
    const problem = (contest.problems ?? []).find((p) => p.slug === slug);

    const mine: any = slug
      ? await this.submissionModel
          .findOne({
            contestId,
            studentId: attempt.studentId,
            problemSlug: slug,
            problemType: 'coding',
          })
          .sort({ submittedAt: -1 })
          .lean()
      : null;

    let match: any = null;
    const matchedId = ig.similarity?.matchedSubmissionId;
    if (matchedId && isValidObjectId(matchedId)) {
      const other: any = await this.submissionModel
        .findById(matchedId)
        .select('studentId studentName code')
        .lean();
      if (other) {
        match = {
          submissionId: String(other._id),
          student: { id: other.studentId, fullName: other.studentName },
          code: other.code ?? '',
        };
      }
    }

    return {
      id: String(attempt._id),
      submittedAt: ig.timeline?.submittedAt ?? attempt.updatedAt,
      judgeStatus: attempt.finishedAt ? 'FINISHED' : 'IN_PROGRESS',
      student: { id: attempt.studentId, fullName: attempt.studentName },
      exercise: {
        id: slug ?? '',
        slug,
        title: problem?.title ?? contest.title,
      },
      integrity: ig,
      code: mine?.code ?? '',
      match,
    };
  }

  async reviewIntegrity(
    id: string,
    attemptId: string,
    input: IntegrityReviewInput,
    requester: ContestViewer,
  ) {
    const contest = await this.contestService.getContestForStaff(id, requester);
    const decision = input?.decision as IntegrityDecision;
    if (!INTEGRITY_DECISIONS.includes(decision)) {
      throw new BadRequestException(
        `Kết luận phải là một trong: ${INTEGRITY_DECISIONS.join(', ')}`,
      );
    }
    const note = (input?.note ?? '').trim();
    if (!note) {
      throw new BadRequestException('Cần nhập lý do/nhận xét khi duyệt');
    }
    await this.findAttemptOrThrow(String(contest._id), attemptId);
    // Chỉ ghi các trường duyệt; không đụng tới điểm, bài nộp hay trạng thái lượt thi.
    await this.attemptModel.updateOne(
      { _id: attemptId },
      {
        $set: {
          'integrity.reviewStatus': 'REVIEWED',
          'integrity.decision': decision,
          'integrity.reviewNote': note.slice(0, 2000),
          'integrity.reviewedBy': requester.sub,
          'integrity.reviewedAt': new Date(),
        },
      },
    );
    return {
      id: attemptId,
      reviewStatus: 'REVIEWED',
      decision,
      reviewedBy: requester.sub,
    };
  }

  /** Ngân hàng câu hỏi trắc nghiệm để ghép thành một phần thi. */
  async listQuestionBank(query: {
    q?: string;
    category?: string;
    difficulty?: string;
    limit?: string;
    band?: string;
  }) {
    const filter: Record<string, unknown> = {};
    const band = normalizeBankBand(query.band);
    if (band) Object.assign(filter, questionBandFilter(band));
    if (query.category) filter.category = String(query.category);
    if (['EASY', 'MEDIUM', 'HARD'].includes(String(query.difficulty))) {
      filter.difficulty = query.difficulty;
    }
    const q = (query.q ?? '').trim().slice(0, 100);
    if (q) filter.content = { $regex: escapeRegExp(q), $options: 'i' };
    const limit = Math.min(Math.max(parseInt(query.limit ?? '100', 10) || 100, 1), 200);

    const [items, categories] = await Promise.all([
      this.questionModel
        .find(filter)
        .select('content category difficulty points codeSnippet')
        .sort({ category: 1, createdAt: 1 })
        .limit(limit)
        .lean(),
      this.questionModel.distinct('category'),
    ]);
    return {
      categories: (categories as string[]).sort(),
      items: (items as any[]).map((i) => ({
        id: String(i._id),
        content: String(i.content).slice(0, 200),
        category: i.category,
        difficulty: i.difficulty,
        points: i.points,
        hasCode: !!i.codeSnippet,
      })),
    };
  }

  /** Bài Code Playground (Python) có thể đưa vào cuộc thi. */
  async listExerciseBank(query: { q?: string; topic?: string; band?: string }) {
    const filter: Record<string, unknown> = { type: 'CODE_TEXT' };
    const band = normalizeBankBand(query.band);
    if (band) Object.assign(filter, exerciseBandFilter(band));
    if (query.topic) filter.topic = String(query.topic);
    const q = (query.q ?? '').trim().slice(0, 100);
    if (q) filter.title = { $regex: escapeRegExp(q), $options: 'i' };
    const items: any[] = await this.exerciseModel
      .find(filter)
      .select('title slug difficulty points topic gradeBand targetGroup bankBand bankOnly testCases resource_id')
      .sort({ topic: 1, orderInTopic: 1, title: 1 })
      .limit(300)
      .lean();
    return items
      .filter((e) => !e.resource_id)
      .map((e) => ({
        slug: e.slug,
        title: e.title,
        difficulty: e.difficulty,
        points: e.points,
        topic: e.topic ?? null,
        band: bandOfExercise(e),
        fromBank: e.bankOnly === true,
        testCaseCount: (e.testCases ?? []).length,
      }));
  }
}
