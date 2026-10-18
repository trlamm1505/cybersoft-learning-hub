import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Question,
  QuestionDocument,
} from '../../modules-system/database/schemas/question.schema';
import {
  QuizAttempt,
  QuizAttemptDocument,
} from '../../modules-system/database/schemas/quiz-attempt.schema';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { DEFAULT_REVIEW_POLICY } from './dto/review-attempt.dto';
import type { ReviewPolicyType } from './dto/review-attempt.dto';
import { seededShuffle } from '../../common/helper/prng.helper';
import { quizBandOfStudent } from './quiz-grade';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { ClassAssignmentsService } from '../class-assignments/class-assignments.service';
import { optionalString, requireString } from '../../common/utils/input.util';

/** Số câu trả lời tối đa trong một lần nộp (chặn payload phình to). */
const MAX_ANSWERS = 500;

/**
 * answers phải là mảng [{ questionId, selectedOptionKey }] với hai trường là chuỗi (Day 30, DEF-052). Sai định dạng thì
 * 400 TRƯỚC khi đụng tới lượt thi, nên lượt thi vẫn giữ nguyên IN_PROGRESS.
 */
export function parseQuizAnswers(raw: unknown): Array<{ questionId: string; selectedOptionKey: string }> {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new BadRequestException('answers phải là mảng các câu trả lời { questionId, selectedOptionKey }.');
  if (raw.length > MAX_ANSWERS) throw new BadRequestException(`answers tối đa ${MAX_ANSWERS} câu.`);
  return raw.map((item, i) => {
    const it = item as { questionId?: unknown; selectedOptionKey?: unknown } | null;
    if (!it || typeof it !== 'object' || typeof it.questionId !== 'string' || typeof it.selectedOptionKey !== 'string') {
      throw new BadRequestException(`answers[${i}] phải có questionId và selectedOptionKey dạng chuỗi.`);
    }
    return { questionId: it.questionId, selectedOptionKey: it.selectedOptionKey };
  });
}

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,

    @InjectModel(QuizAttempt.name)
    private readonly quizAttemptModel: Model<QuizAttemptDocument>,

    private readonly classAssignments: ClassAssignmentsService,
  ) {}

  /**
   * 1. Start Attempt (Bắt đầu làm bài):
   * Khởi tạo lượt thi, xáo trộn phương án ngầm bằng SEED, ẩn đáp án đúng & giải thích
   */
  /**
   * Bắt đầu lượt thi của một bài trắc nghiệm được giao cho lớp: câu hỏi do giảng viên chọn, chỉ một lượt, hết giờ làm bài
   * không vượt quá hạn chót. Lượt thi mang assignmentId nên mới được tính điểm lớp.
   */
  private async startAssignmentAttempt(userId: string, dto: StartAttemptDto, user?: JwtPayload) {
    if (!user) throw new ForbiddenException('Vui lòng đăng nhập để làm bài của lớp.');
    const assignment = await this.classAssignments.assertCanStartQuiz(dto.assignmentId as string, user);

    const existing = await this.quizAttemptModel.findOne({
      userId: new Types.ObjectId(userId),
      assignmentId: dto.assignmentId,
      status: 'IN_PROGRESS',
    });
    if (existing) return this.formatSanitizedQuestions(existing);

    const questions = await this.questionModel
      .find({ _id: { $in: (assignment.questionIds ?? []).filter((i) => Types.ObjectId.isValid(i)) } })
      .exec();
    if (questions.length === 0) throw new NotFoundException('Bài trắc nghiệm chưa có câu hỏi.');

    const seed = `${userId}_${dto.assignmentId}_${Date.now()}`;
    const shuffled = questions.map((q) => ({
      questionId: q._id,
      optionKeysOrder: seededShuffle(q.options.map((o) => o.key), `${seed}_${q._id}`),
      selectedOptionKey: undefined,
      isCorrect: false,
      scoreEarned: 0,
    }));
    const untilDue = Math.floor((new Date(assignment.dueAt).getTime() - Date.now()) / 1000);
    const created = await this.quizAttemptModel.create({
      userId: new Types.ObjectId(userId),
      testId: new Types.ObjectId(dto.testId),
      assignmentId: dto.assignmentId,
      seed,
      shuffledQuestions: shuffled,
      startedAt: new Date(),
      timeLimitSeconds: Math.max(60, Math.min(1800, untilDue)),
      status: 'IN_PROGRESS',
      score: 0,
      maxScore: questions.reduce((sum, q) => sum + (q.points || 10), 0),
      reviewPolicy: DEFAULT_REVIEW_POLICY,
    });
    return this.formatSanitizedQuestions(created);
  }

  async startAttempt(userId: string, dto: StartAttemptDto, ageGroup?: string | null, user?: JwtPayload) {
    // Kiểu dữ liệu sai (vd object { $ne: null }) → 400 rõ ràng, không lọt vào truy vấn hay ném 500 (DEF-050).
    const testId = requireString(dto?.testId, 'testId', { max: 64 });
    const category = optionalString(dto?.category, 'category', { max: 60 }) || undefined;
    optionalString(dto?.assignmentId, 'assignmentId', { max: 64 });

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(testId)) {
      throw new BadRequestException('ID người dùng hoặc bài thi không hợp lệ.');
    }

    if (dto.assignmentId) return this.startAssignmentAttempt(userId, dto, user);

    // Check existing in-progress attempt. Matched on `category` too — multiple quiz topics
    // (e.g. "Fullstack Web" vs "Python") share the same demo testId, so without this an
    // in-progress attempt from one topic would incorrectly be reused for the other.
    const existingAttempt = await this.quizAttemptModel.findOne({
      userId: new Types.ObjectId(userId),
      testId: new Types.ObjectId(testId),
      category: category ?? { $exists: false },
      assignmentId: { $exists: false }, // lượt luyện tập tự do, không lẫn với lượt thi của bài lớp
      status: 'IN_PROGRESS',
    });

    if (existingAttempt) {
      // Re-use active in-progress attempt to prevent duplication
      return this.formatSanitizedQuestions(existingAttempt);
    }

    // Fetch questions for this quiz topic. Each SYSTEM_QUIZZES topic maps 1:1 to a
    // Question.category value (Python / HTML5 / CSS3). Falls back to the full bank
    // when no category is given (backward compatibility).
    const questionFilter: Record<string, unknown> = !category ? {} : { category };
    // Học viên 6-9 / 10-12 chỉ nhận câu ôn tập của đúng khối (câu chưa gắn khối vẫn hiện cho mọi khối).
    const band = quizBandOfStudent(ageGroup);
    // Câu do giảng viên soạn trong Ngân hàng đề chỉ dùng cho bài giao của lớp và cuộc thi, KHÔNG xuất hiện ở /quiz tự luyện.
    const notBank = (list: QuestionDocument[] | null | undefined) => (list ?? []).filter((q) => (q as { bankOnly?: boolean }).bankOnly !== true);
    let questions = notBank(
      await this.questionModel
        .find(band ? { ...questionFilter, $or: [{ gradeBands: band }, { gradeBands: { $exists: false } }] } : questionFilter)
        .exec(),
    );
    // Khối chưa có câu công khai nào cho chủ đề này thì dùng toàn bộ chủ đề thay vì chặn học viên (xét SAU khi bỏ câu Ngân hàng đề).
    if (band && questions.length === 0) questions = notBank(await this.questionModel.find(questionFilter).exec());
    if (!questions || questions.length === 0) {
      throw new NotFoundException(
        'Không tìm thấy câu hỏi nào trong hệ thống bài thi.',
      );
    }

    // Create unique deterministic seed
    const seed = `${userId}_${testId}_${Date.now()}`;

    // Shuffle questions and options deterministically using PRNG seed
    const shuffledQuestionItems = questions.map((q) => {
      const optionKeys = q.options.map((opt) => opt.key);
      const shuffledKeysOrder = seededShuffle(optionKeys, `${seed}_${q._id}`);

      return {
        questionId: q._id,
        optionKeysOrder: shuffledKeysOrder,
        selectedOptionKey: undefined,
        isCorrect: false,
        scoreEarned: 0,
      };
    });

    const maxScore = questions.reduce((sum, q) => sum + (q.points || 10), 0);

    const newAttempt = await this.quizAttemptModel.create({
      userId: new Types.ObjectId(userId),
      testId: new Types.ObjectId(testId),
      category,
      seed,
      shuffledQuestions: shuffledQuestionItems,
      startedAt: new Date(),
      timeLimitSeconds: 1800, // 30 minutes
      status: 'IN_PROGRESS',
      score: 0,
      maxScore,
      reviewPolicy: DEFAULT_REVIEW_POLICY,
    });

    return this.formatSanitizedQuestions(newAttempt);
  }

  /**
   * 2. Submit Attempt (Nộp bài & Tự động chấm điểm):
   * Kiểm tra thời hạn (chống nộp quá hạn), chấm điểm tự động và cập nhật điểm số
   */
  async submitAttempt(
    attemptId: string,
    userId: string,
    dto: SubmitAttemptDto,
  ) {
    // Kiểm tra định dạng answers trước khi đọc lượt thi: sai thì 400, lượt thi giữ nguyên IN_PROGRESS (DEF-052).
    const answers = parseQuizAnswers(dto?.answers);

    if (!Types.ObjectId.isValid(attemptId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(
        'ID lượt thi hoặc người dùng không hợp lệ.',
      );
    }

    const attempt = await this.quizAttemptModel.findOne({
      _id: new Types.ObjectId(attemptId),
      userId: new Types.ObjectId(userId),
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy lượt làm bài thi này.');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        `Lượt làm bài đã kết thúc trước đó với trạng thái: ${attempt.status}`,
      );
    }

    // Check time limit with 15-second grace period for network latency
    const elapsedSeconds =
      (Date.now() - new Date(attempt.startedAt).getTime()) / 1000;
    const allowedTimeSeconds = attempt.timeLimitSeconds + 15;

    if (elapsedSeconds > allowedTimeSeconds) {
      attempt.status = 'EXPIRED';
      attempt.submittedAt = new Date();
      attempt.score = 0;
      await attempt.save();
      throw new BadRequestException(
        'Bài thi đã quá thời hạn nộp bài. Lượt thi bị hủy.',
      );
    }

    // Map answers by questionId
    const answerMap = new Map<string, string>();
    answers.forEach((ans) => {
      answerMap.set(ans.questionId, ans.selectedOptionKey);
    });

    // Fetch questions to grade
    const questionIds = attempt.shuffledQuestions.map((sq) => sq.questionId);
    const questions = await this.questionModel
      .find({ _id: { $in: questionIds } })
      .exec();
    const questionMap = new Map<string, QuestionDocument>();
    questions.forEach((q) => questionMap.set(q._id.toString(), q));

    let totalScore = 0;

    // Grade each question
    attempt.shuffledQuestions.forEach((sq) => {
      const qIdStr = sq.questionId.toString();
      const selectedKey = answerMap.get(qIdStr);
      sq.selectedOptionKey = selectedKey;

      const originalQuestion = questionMap.get(qIdStr);
      if (originalQuestion && selectedKey) {
        const selectedOption = originalQuestion.options.find(
          (opt) => opt.key === selectedKey,
        );
        if (selectedOption && selectedOption.isCorrect) {
          sq.isCorrect = true;
          sq.scoreEarned = originalQuestion.points || 10;
          totalScore += sq.scoreEarned;
        } else {
          sq.isCorrect = false;
          sq.scoreEarned = 0;
        }
      } else {
        sq.isCorrect = false;
        sq.scoreEarned = 0;
      }
    });

    attempt.status = 'GRADED';
    attempt.submittedAt = new Date();
    attempt.score = totalScore;

    await attempt.save();

    return {
      message: 'Nộp bài thi và chấm điểm thành công!',
      attemptId: attempt._id,
      status: attempt.status,
      score: attempt.score,
      maxScore: attempt.maxScore,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
    };
  }

  /**
   * 3. Review Attempt (Xem kết quả & Giải thích chi tiết):
   * Policy đọc từ attempt đã lưu (chốt phía server lúc bắt đầu), không nhận từ
   * client. Bài còn IN_PROGRESS thì KHÔNG BAO GIỜ trả đáp án, bất kể policy.
   */
  async reviewAttempt(attemptId: string, userId: string) {
    if (!Types.ObjectId.isValid(attemptId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(
        'ID lượt thi hoặc người dùng không hợp lệ.',
      );
    }

    const attempt = await this.quizAttemptModel.findOne({
      _id: new Types.ObjectId(attemptId),
      userId: new Types.ObjectId(userId),
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy lượt làm bài thi này.');
    }

    if (attempt.status === 'IN_PROGRESS') {
      throw new BadRequestException(
        'Bạn phải nộp bài thi trước khi xem đáp án và giải thích chi tiết.',
      );
    }

    const policy = (attempt.reviewPolicy ??
      DEFAULT_REVIEW_POLICY) as ReviewPolicyType;
    switch (policy) {
      case 'NEVER':
        throw new ForbiddenException(
          'Giảng viên đã tắt chức năng xem giải thích cho bài thi này.',
        );

      case 'AFTER_DEADLINE': {
        const deadline =
          new Date(attempt.startedAt).getTime() +
          (attempt.timeLimitSeconds ?? 0) * 1000;
        if (Date.now() < deadline) {
          throw new BadRequestException(
            'Chưa đến thời điểm được xem đáp án (sau Hạn nộp đề thi).',
          );
        }
        break;
      }

      case 'AFTER_SUBMISSION':
      case 'IMMEDIATE':
      default:
        break;
    }

    // Fetch full question documents
    const questionIds = attempt.shuffledQuestions.map((sq) => sq.questionId);
    const questions = await this.questionModel
      .find({ _id: { $in: questionIds } })
      .exec();
    const questionMap = new Map<string, QuestionDocument>();
    questions.forEach((q) => questionMap.set(q._id.toString(), q));

    // Construct detailed review payload
    const reviewQuestions = attempt.shuffledQuestions
      .map((sq) => {
        const qIdStr = sq.questionId.toString();
        const originalQ = questionMap.get(qIdStr);

        if (!originalQ) {
          return null;
        }

        // Re-apply deterministic option order
        const optionMap = new Map(
          originalQ.options.map((opt) => [opt.key, opt]),
        );
        const orderedOptions = sq.optionKeysOrder
          .map((key) => optionMap.get(key))
          .filter((opt) => !!opt)
          .map((opt) => ({
            key: opt.key,
            text: opt.text,
            isCorrect: opt.isCorrect, // Include correct flag for review
          }));

        const correctOption = originalQ.options.find((opt) => opt.isCorrect);

        return {
          questionId: originalQ._id,
          content: originalQ.content,
          codeSnippet: originalQ.codeSnippet,
          category: originalQ.category,
          difficulty: originalQ.difficulty,
          points: originalQ.points,
          options: orderedOptions,
          selectedOptionKey: sq.selectedOptionKey,
          correctOptionKey: correctOption ? correctOption.key : null,
          isCorrect: sq.isCorrect,
          scoreEarned: sq.scoreEarned,
          explanation: originalQ.explanation, // Detailed explanation
        };
      })
      .filter((q) => q !== null);

    return {
      attemptId: attempt._id,
      userId: attempt.userId,
      testId: attempt.testId,
      status: attempt.status,
      score: attempt.score,
      maxScore: attempt.maxScore,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      reviewPolicyApplied: policy,
      questions: reviewQuestions,
    };
  }

  /**
   * Private helper to format sanitized response for students taking the test
   * Strips out 'isCorrect' and 'explanation' fields!
   */
  private async formatSanitizedQuestions(attempt: QuizAttemptDocument) {
    const questionIds = attempt.shuffledQuestions.map((sq) => sq.questionId);
    const questions = await this.questionModel
      .find({ _id: { $in: questionIds } })
      .exec();
    const questionMap = new Map<string, QuestionDocument>();
    questions.forEach((q) => questionMap.set(q._id.toString(), q));

    const sanitizedQuestions = attempt.shuffledQuestions
      .map((sq) => {
        const qIdStr = sq.questionId.toString();
        const originalQ = questionMap.get(qIdStr);

        if (!originalQ) return null;

        const optionMap = new Map(
          originalQ.options.map((opt) => [opt.key, opt]),
        );
        const orderedOptions = sq.optionKeysOrder
          .map((key) => optionMap.get(key))
          .filter((opt) => !!opt)
          .map((opt) => ({
            key: opt.key,
            text: opt.text,
            // EXPLICITLY STRIPPED OUT: isCorrect
          }));

        return {
          questionId: originalQ._id,
          content: originalQ.content,
          codeSnippet: originalQ.codeSnippet,
          category: originalQ.category,
          difficulty: originalQ.difficulty,
          points: originalQ.points,
          options: orderedOptions,
          selectedOptionKey: sq.selectedOptionKey,
          // EXPLICITLY STRIPPED OUT: explanation
        };
      })
      .filter((q) => q !== null);

    return {
      attemptId: attempt._id,
      testId: attempt.testId,
      startedAt: attempt.startedAt,
      timeLimitSeconds: attempt.timeLimitSeconds,
      status: attempt.status,
      questions: sanitizedQuestions,
    };
  }
}
