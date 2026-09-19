import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contest, ContestDocument, ContestProblem } from '../../modules-system/database/schemas/contest.schema';
import { Lesson, LessonDocument } from '../../modules-system/database/schemas/lesson.schema';
import {
  ContestSubmission,
  ContestSubmissionDocument,
  ContestSubmissionVerdict,
} from '../../modules-system/database/schemas/contest-submission.schema';
import { checkPythonSyntax, runPythonCode } from '../../common/helper/code-runner.helper';
import { SubmitContestProblemDto } from './dto/submit-contest-problem.dto';

const DEFAULT_CODING_TIME_LIMIT_MS = 2000;

@Injectable()
export class ContestSubmissionService {
  constructor(
    @InjectModel(Contest.name) private readonly contestModel: Model<ContestDocument>,
    @InjectModel(Lesson.name) private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(ContestSubmission.name)
    private readonly contestSubmissionModel: Model<ContestSubmissionDocument>,
  ) {}

  private async findContestOrThrow(id: string): Promise<ContestDocument> {
    const contest = await this.contestModel
      .findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }] })
      .exec();
    if (!contest) {
      throw new NotFoundException(`Không tìm thấy cuộc thi với ID hoặc slug: ${id}`);
    }
    return contest;
  }

  private findProblemOrThrow(contest: ContestDocument, problemSlug: string): ContestProblem {
    const problem = contest.problems?.find((p) => p.slug === problemSlug);
    if (!problem) {
      throw new NotFoundException(`Không tìm thấy đề bài "${problemSlug}" trong cuộc thi này`);
    }
    return problem;
  }

  async getProblemForStudent(contestId: string, problemSlug: string) {
    const contest = await this.findContestOrThrow(contestId);
    const now = new Date();
    if (now < contest.startTime) {
      throw new BadRequestException('Cuộc thi chưa bắt đầu. Chưa thể xem đề bài.');
    }
    if (now > contest.endTime) {
      throw new BadRequestException('Cuộc thi đã kết thúc. Không thể xem đề bài nữa.');
    }

    const problem = this.findProblemOrThrow(contest, problemSlug);
    const lesson = problem.lessonId ? await this.lessonModel.findById(problem.lessonId).lean() : null;

    if (problem.type === 'quiz') {
      const quizQuestions = (lesson?.quizQuestions ?? []).map((q) => ({
        content: q.content,
        codeSnippet: q.codeSnippet,
        points: q.points,
        options: (q.options ?? []).map((o) => ({ key: o.key, text: o.text })), // isCorrect stripped
      }));
      return {
        slug: problem.slug,
        title: problem.title,
        type: 'quiz' as const,
        maxPoints: problem.points,
        quizQuestions,
      };
    }

    const testCases = (lesson?.testCases ?? []).map((tc) => ({
      input: tc.isHidden ? undefined : tc.input,
      expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
      isHidden: tc.isHidden,
    }));
    return {
      slug: problem.slug,
      title: problem.title,
      type: 'coding' as const,
      maxPoints: problem.points,
      content: lesson?.content ?? '',
      starterCode: lesson?.starterCode ?? '',
      testCasesCount: (lesson?.testCases ?? []).length,
      testCases,
    };
  }

  async submit(contestId: string, dto: SubmitContestProblemDto) {
    if (!dto.studentId || !dto.studentId.trim()) {
      throw new BadRequestException('Mã học viên (studentId) không được để trống!');
    }
    if (!dto.problemSlug || !dto.problemSlug.trim()) {
      throw new BadRequestException('Thiếu mã đề bài (problemSlug)!');
    }

    const contest = await this.findContestOrThrow(contestId);
    const problem = this.findProblemOrThrow(contest, dto.problemSlug);

    const now = new Date();
    const isLate = now > contest.endTime;
    if (now < contest.startTime) {
      throw new BadRequestException('Cuộc thi chưa bắt đầu. Chưa thể nộp bài.');
    }

    const lesson = problem.lessonId ? await this.lessonModel.findById(problem.lessonId).lean() : null;

    const graded =
      problem.type === 'quiz'
        ? await this.gradeQuiz(problem, lesson, dto.quizAnswers ?? {})
        : await this.gradeCoding(problem, lesson, dto.code ?? '');

    await this.contestSubmissionModel.create({
      contestId: String(contest._id),
      problemSlug: problem.slug,
      problemType: problem.type,
      studentId: dto.studentId,
      studentName: dto.studentName || 'Học viên',
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

    return {
      verdict: graded.verdict,
      passedCount: graded.passedCount,
      totalCount: graded.totalCount,
      score: graded.score,
      maxPoints: problem.points,
      isLate,
    };
  }

  private async gradeCoding(
    problem: ContestProblem,
    lesson: LessonDocument | null,
    code: string,
  ): Promise<{ verdict: ContestSubmissionVerdict; score: number; passedCount: number; totalCount: number }> {
    const testCases = lesson?.testCases ?? [];
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
      const run = await runPythonCode(code, tc.input, DEFAULT_CODING_TIME_LIMIT_MS);
      if (run.blocked) {
        failureVerdict = 'RE';
        continue;
      }
      const passed = !run.timedOut && run.exitCode === 0 && run.stdout.trim() === tc.expectedOutput.trim();
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
    if (totalCount === 0) {
      verdict = 'AC';
    } else if (passedCount === totalCount) {
      verdict = 'AC';
    } else if (passedCount === 0) {
      verdict = failureVerdict ?? 'WA';
    } else if (failureVerdict === 'TLE' || failureVerdict === 'RE') {
      verdict = failureVerdict;
    } else {
      verdict = 'PARTIAL';
    }

    const score = totalCount === 0 ? problem.points : Math.round((passedCount / totalCount) * problem.points);
    return { verdict, score, passedCount, totalCount };
  }

  private async gradeQuiz(
    problem: ContestProblem,
    lesson: LessonDocument | null,
    quizAnswers: Record<string, string>,
  ): Promise<{ verdict: ContestSubmissionVerdict; score: number; passedCount: number; totalCount: number }> {
    const questions = lesson?.quizQuestions ?? [];
    const totalCount = questions.length;
    let passedCount = 0;

    questions.forEach((q, idx) => {
      const correctKey = q.options?.find((o) => o.isCorrect)?.key;
      const selectedKey = quizAnswers[String(idx)];
      if (correctKey !== undefined && selectedKey === correctKey) {
        passedCount++;
      }
    });

    const score = totalCount === 0 ? 0 : Math.round((passedCount / totalCount) * problem.points);
    const verdict: ContestSubmissionVerdict =
      totalCount === 0 || passedCount === totalCount ? 'AC' : passedCount === 0 ? 'WA' : 'PARTIAL';

    return { verdict, score, passedCount, totalCount };
  }
}
