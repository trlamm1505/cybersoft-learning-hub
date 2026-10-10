import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Contest,
  ContestDocument,
  ContestProblem,
} from '../../modules-system/database/schemas/contest.schema';
import {
  ContestSubmission,
  ContestSubmissionDocument,
  ContestSubmissionVerdict,
} from '../../modules-system/database/schemas/contest-submission.schema';
import {
  User,
  UserDocument,
} from '../../modules-system/database/schemas/user.schema';
import {
  checkPythonSyntax,
  runPythonCode,
} from '../../common/helper/code-runner.helper';
import { SubmitContestProblemDto } from './dto/submit-contest-problem.dto';
import {
  ContestProblemContentService,
  ResolvedProblemContent,
} from './contest-problem-content.service';
import { ContestAttemptService } from './contest-attempt.service';

@Injectable()
export class ContestSubmissionService {
  constructor(
    @InjectModel(Contest.name)
    private readonly contestModel: Model<ContestDocument>,
    @InjectModel(ContestSubmission.name)
    private readonly contestSubmissionModel: Model<ContestSubmissionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly contentService: ContestProblemContentService,
    private readonly attemptService: ContestAttemptService,
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

  private findProblemOrThrow(
    contest: ContestDocument,
    problemSlug: string,
  ): ContestProblem {
    const problem = contest.problems?.find((p) => p.slug === problemSlug);
    if (!problem) {
      throw new NotFoundException(
        `Không tìm thấy đề bài "${problemSlug}" trong cuộc thi này`,
      );
    }
    return problem;
  }

  /**
   * Đề bài chỉ cho học viên đã đăng ký VÀ đã bấm vào thi (đang trong giờ làm
   * bài cá nhân) xem; giảng viên/quản trị viên xem để kiểm tra đề (không nộp
   * bài được, xem StudentOnlyGuard ở controller).
   */
  async getProblemForStudent(
    contestId: string,
    problemSlug: string,
    viewer: { sub: string; role: string },
  ) {
    const contest = await this.findContestOrThrow(contestId);
    if (viewer.role === 'STUDENT') {
      this.assertRegistered(contest, viewer.sub);
    }
    const now = new Date();
    if (now < contest.startTime) {
      throw new BadRequestException(
        'Cuộc thi chưa bắt đầu. Chưa thể xem đề bài.',
      );
    }
    if (now > contest.endTime) {
      throw new BadRequestException(
        'Cuộc thi đã kết thúc. Không thể xem đề bài nữa.',
      );
    }
    if (viewer.role === 'STUDENT') {
      await this.attemptService.requireActive(contest, viewer.sub, now);
    }

    const problem = this.findProblemOrThrow(contest, problemSlug);
    const content = await this.contentService.resolve(problem);

    if (problem.type === 'quiz') {
      const quizQuestions = content.quizQuestions.map((q) => ({
        content: q.content,
        codeSnippet: q.codeSnippet,
        points: q.points,
        options: q.options.map((o) => ({ key: o.key, text: o.text })), // isCorrect stripped
      }));
      return {
        slug: problem.slug,
        title: problem.title,
        type: 'quiz' as const,
        maxPoints: problem.points,
        quizQuestions,
      };
    }

    const testCases = content.testCases.map((tc) => ({
      input: tc.isHidden ? undefined : tc.input,
      expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
      isHidden: tc.isHidden,
    }));
    return {
      slug: problem.slug,
      title: problem.title,
      type: 'coding' as const,
      maxPoints: problem.points,
      content: content.content,
      starterCode: content.starterCode,
      testCasesCount: content.testCases.length,
      testCases,
    };
  }

  async submit(
    contestId: string,
    dto: SubmitContestProblemDto,
    studentId: string,
  ) {
    if (!dto.problemSlug || !dto.problemSlug.trim()) {
      throw new BadRequestException('Thiếu mã đề bài (problemSlug)!');
    }

    const contest = await this.findContestOrThrow(contestId);
    this.assertRegistered(contest, studentId);
    const problem = this.findProblemOrThrow(contest, dto.problemSlug);

    const now = new Date();
    const isLate = now > contest.endTime;
    if (now < contest.startTime) {
      throw new BadRequestException('Cuộc thi chưa bắt đầu. Chưa thể nộp bài.');
    }

    // Trong giờ thi phải có lượt thi đang mở: giờ cá nhân do máy chủ giữ, nên
    // hết giờ hay đã nộp bài thi là bị từ chối. Sau khi cuộc thi kết thúc bài
    // vẫn được ghi log (isLate) để đối soát nhưng không tính điểm.
    const attempt = isLate
      ? null
      : await this.attemptService.requireActive(contest, studentId, now);

    // Quiz chấm ngay và leaderboard hiện điểm trực tiếp: cho nộp nhiều lần là
    // dò được đáp án. Trong thời gian thi, mỗi câu quiz chỉ được nộp một lần.
    if (problem.type === 'quiz' && !isLate) {
      const already = await this.contestSubmissionModel.exists({
        contestId: String(contest._id),
        problemSlug: problem.slug,
        studentId,
        isLate: false,
      });
      if (already) {
        throw new BadRequestException(
          'Bài trắc nghiệm trong cuộc thi chỉ được nộp một lần.',
        );
      }
    }

    const content = await this.contentService.resolve(problem);
    if (problem.type === 'quiz' ? content.quizQuestions.length === 0 : content.testCases.length === 0) {
      // Trước đây đề không có test case bị chấm AC full điểm cho mọi bài làm.
      throw new BadRequestException(
        'Đề này chưa có nội dung chấm điểm nên chưa thể nộp. Vui lòng báo giảng viên.',
      );
    }

    const graded =
      problem.type === 'quiz'
        ? this.gradeQuiz(problem, content, dto.quizAnswers ?? {})
        : await this.gradeCoding(problem, content, dto.code ?? '');

    const user = await this.userModel
      .findById(studentId)
      .select('fullName')
      .lean();
    const studentName = user?.fullName || 'Học viên';

    await this.contestSubmissionModel.create({
      contestId: String(contest._id),
      problemSlug: problem.slug,
      problemType: problem.type,
      studentId,
      studentName,
      code: problem.type === 'coding' ? dto.code : undefined,
      quizAnswers: problem.type === 'quiz' ? dto.quizAnswers : undefined,
      score: graded.score,
      maxPoints: problem.points,
      verdict: graded.verdict,
      passedCount: graded.passedCount,
      totalCount: graded.totalCount,
      submittedAt: now,
      isLate,
    });

    // Tín hiệu liêm chính: chỉ ghi nhận để giảng viên xem xét. Lỗi ở đây
    // không được làm hỏng việc nộp bài, và không đụng tới điểm đã chấm.
    if (attempt && contest.integrityEnabled !== false) {
      try {
        const similarity =
          problem.type === 'coding' && dto.code
            ? await this.attemptService.similarityFor(
                String(contest._id),
                problem.slug,
                studentId,
                dto.code,
                content.starterCode,
              )
            : null;
        await this.attemptService.recordIntegrity(
          contest,
          attempt,
          dto.integrity,
          similarity,
          now,
        );
      } catch {
        // bỏ qua
      }
    }

    // Không trả kết quả chi tiết của quiz khi cuộc thi chưa kết thúc: điểm đã
    // được lưu và hiện trên leaderboard, nhưng response không cho biết đúng/sai.
    if (problem.type === 'quiz' && !isLate) {
      return {
        verdict: 'SUBMITTED' as const,
        passedCount: null,
        totalCount: graded.totalCount,
        score: null,
        maxPoints: problem.points,
        isLate,
        resultHidden: true,
      };
    }

    return {
      verdict: graded.verdict,
      passedCount: graded.passedCount,
      totalCount: graded.totalCount,
      score: graded.score,
      maxPoints: problem.points,
      isLate,
      resultHidden: false,
    };
  }

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

  private async gradeCoding(
    problem: ContestProblem,
    content: ResolvedProblemContent,
    code: string,
  ): Promise<{
    verdict: ContestSubmissionVerdict;
    score: number;
    passedCount: number;
    totalCount: number;
  }> {
    const testCases = content.testCases;
    const totalCount = testCases.length;

    if (!code || !code.trim()) {
      return { verdict: 'WA', score: 0, passedCount: 0, totalCount };
    }

    const syntaxCheck = await checkPythonSyntax(code);
    if (!syntaxCheck.ok) {
      return { verdict: 'CE', score: 0, passedCount: 0, totalCount };
    }

    // 'WA' here just means "at least one plain wrong-answer failure happened"; it gets
    // reclassified to PARTIAL below if some other test case did pass. TLE/RE stay authoritative
    // regardless of partial passes, matching judge-queue.service.ts's failure precedence.
    let failureVerdict: ContestSubmissionVerdict | null = null;
    let passedCount = 0;

    for (const tc of testCases) {
      const run = await runPythonCode(code, tc.input, content.timeLimitMs);
      if (run.blocked) {
        failureVerdict = 'RE';
        continue;
      }
      const passed =
        !run.timedOut &&
        run.exitCode === 0 &&
        run.stdout.trim() === tc.expectedOutput.trim();
      if (passed) {
        passedCount++;
      } else if (run.timedOut) {
        failureVerdict = 'TLE';
      } else if (run.exitCode !== 0) {
        failureVerdict = failureVerdict === 'TLE' ? failureVerdict : 'RE';
      } else if (!failureVerdict) {
        failureVerdict = 'WA';
      }
    }

    let verdict: ContestSubmissionVerdict;
    if (passedCount === totalCount) {
      verdict = 'AC';
    } else if (passedCount === 0) {
      verdict = failureVerdict ?? 'WA';
    } else if (failureVerdict === 'TLE' || failureVerdict === 'RE') {
      verdict = failureVerdict;
    } else {
      verdict = 'PARTIAL';
    }

    const score = Math.round((passedCount / totalCount) * problem.points);
    return { verdict, score, passedCount, totalCount };
  }

  private gradeQuiz(
    problem: ContestProblem,
    content: ResolvedProblemContent,
    quizAnswers: Record<string, string>,
  ): {
    verdict: ContestSubmissionVerdict;
    score: number;
    passedCount: number;
    totalCount: number;
  } {
    const questions = content.quizQuestions;
    const totalCount = questions.length;
    let passedCount = 0;

    questions.forEach((q, idx) => {
      const correctKey = q.options?.find((o) => o.isCorrect)?.key;
      const selectedKey = quizAnswers[String(idx)];
      if (correctKey !== undefined && selectedKey === correctKey) {
        passedCount++;
      }
    });

    const score = Math.round((passedCount / totalCount) * problem.points);
    const verdict: ContestSubmissionVerdict =
      passedCount === totalCount ? 'AC' : passedCount === 0 ? 'WA' : 'PARTIAL';

    return { verdict, score, passedCount, totalCount };
  }
}
