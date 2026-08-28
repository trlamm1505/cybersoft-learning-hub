import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument } from '../../modules-system/database/schemas/question.schema';
import { QuizAttempt, QuizAttemptDocument } from '../../modules-system/database/schemas/quiz-attempt.schema';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { ReviewPolicyType } from './dto/review-attempt.dto';
import { seededShuffle } from '../../common/helper/prng.helper';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,

    @InjectModel(QuizAttempt.name)
    private readonly quizAttemptModel: Model<QuizAttemptDocument>,
  ) {}

  /**
   * 1. Start Attempt (Bắt đầu làm bài):
   * Khởi tạo lượt thi, xáo trộn phương án ngầm bằng SEED, ẩn đáp án đúng & giải thích
   */
  async startAttempt(dto: StartAttemptDto) {
    const { userId, testId } = dto;

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(testId)) {
      throw new BadRequestException('ID người dùng hoặc bài thi không hợp lệ.');
    }

    // Check existing in-progress attempt
    const existingAttempt = await this.quizAttemptModel.findOne({
      userId: new Types.ObjectId(userId),
      testId: new Types.ObjectId(testId),
      status: 'IN_PROGRESS',
    });

    if (existingAttempt) {
      // Re-use active in-progress attempt to prevent duplication
      return this.formatSanitizedQuestions(existingAttempt);
    }

    // Fetch all active questions for the quiz
    const questions = await this.questionModel.find({}).exec();
    if (!questions || questions.length === 0) {
      throw new NotFoundException('Không tìm thấy câu hỏi nào trong hệ thống bài thi.');
    }

    // Create unique deterministic seed
    const seed = `${userId}_${testId}_${Date.now()}`;

    // Shuffle questions and options deterministically using PRNG seed
    const shuffledQuestionItems = questions.map((q) => {
      const optionKeys = q.options.map((opt) => opt.key);
      const shuffledKeysOrder = seededShuffle(optionKeys, `${seed}_${q._id}`);

      return {
        questionId: q._id as Types.ObjectId,
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
      seed,
      shuffledQuestions: shuffledQuestionItems,
      startedAt: new Date(),
      timeLimitSeconds: 1800, // 30 minutes
      status: 'IN_PROGRESS',
      score: 0,
      maxScore,
    });

    return this.formatSanitizedQuestions(newAttempt);
  }

  /**
   * 2. Submit Attempt (Nộp bài & Tự động chấm điểm):
   * Kiểm tra thời hạn (chống nộp quá hạn), chấm điểm tự động và cập nhật điểm số
   */
  async submitAttempt(attemptId: string, dto: SubmitAttemptDto) {
    const { userId, answers } = dto;

    if (!Types.ObjectId.isValid(attemptId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID lượt thi hoặc người dùng không hợp lệ.');
    }

    const attempt = await this.quizAttemptModel.findOne({
      _id: new Types.ObjectId(attemptId),
      userId: new Types.ObjectId(userId),
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy lượt làm bài thi này.');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException(`Lượt làm bài đã kết thúc trước đó với trạng thái: ${attempt.status}`);
    }

    // Check time limit with 15-second grace period for network latency
    const elapsedSeconds = (Date.now() - new Date(attempt.startedAt).getTime()) / 1000;
    const allowedTimeSeconds = attempt.timeLimitSeconds + 15;

    if (elapsedSeconds > allowedTimeSeconds) {
      attempt.status = 'EXPIRED';
      attempt.submittedAt = new Date();
      attempt.score = 0;
      await attempt.save();
      throw new BadRequestException('Bài thi đã quá thời hạn nộp bài. Lượt thi bị hủy.');
    }

    // Map answers by questionId
    const answerMap = new Map<string, string>();
    if (answers && Array.isArray(answers)) {
      answers.forEach((ans) => {
        answerMap.set(ans.questionId, ans.selectedOptionKey);
      });
    }

    // Fetch questions to grade
    const questionIds = attempt.shuffledQuestions.map((sq) => sq.questionId);
    const questions = await this.questionModel.find({ _id: { $in: questionIds } }).exec();
    const questionMap = new Map<string, QuestionDocument>();
    questions.forEach((q) => questionMap.set((q._id as Types.ObjectId).toString(), q));

    let totalScore = 0;

    // Grade each question
    attempt.shuffledQuestions.forEach((sq) => {
      const qIdStr = sq.questionId.toString();
      const selectedKey = answerMap.get(qIdStr);
      sq.selectedOptionKey = selectedKey;

      const originalQuestion = questionMap.get(qIdStr);
      if (originalQuestion && selectedKey) {
        const selectedOption = originalQuestion.options.find((opt) => opt.key === selectedKey);
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
   * Kiểm tra Review Policy để quyết định có trả về đáp án đúng và phần giải thích hay không
   */
  async reviewAttempt(attemptId: string, userId: string, policy: ReviewPolicyType = 'AFTER_SUBMISSION') {
    if (!Types.ObjectId.isValid(attemptId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID lượt thi hoặc người dùng không hợp lệ.');
    }

    const attempt = await this.quizAttemptModel.findOne({
      _id: new Types.ObjectId(attemptId),
      userId: new Types.ObjectId(userId),
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy lượt làm bài thi này.');
    }

    // Enforce Review Policy
    switch (policy) {
      case 'NEVER':
        throw new ForbiddenException('Giảng viên đã tắt chức năng xem giải thích cho bài thi này.');

      case 'AFTER_SUBMISSION':
        if (attempt.status === 'IN_PROGRESS') {
          throw new BadRequestException('Bạn phải nộp bài thi trước khi xem đáp án và giải thích chi tiết.');
        }
        break;

      case 'AFTER_DEADLINE':
        if (attempt.status === 'IN_PROGRESS') {
          throw new BadRequestException('Chưa đến thời điểm được xem đáp án (sau Hạn nộp đề thi).');
        }
        break;

      case 'IMMEDIATE':
      default:
        break;
    }

    // Fetch full question documents
    const questionIds = attempt.shuffledQuestions.map((sq) => sq.questionId);
    const questions = await this.questionModel.find({ _id: { $in: questionIds } }).exec();
    const questionMap = new Map<string, QuestionDocument>();
    questions.forEach((q) => questionMap.set((q._id as Types.ObjectId).toString(), q));

    // Construct detailed review payload
    const reviewQuestions = attempt.shuffledQuestions.map((sq) => {
      const qIdStr = sq.questionId.toString();
      const originalQ = questionMap.get(qIdStr);

      if (!originalQ) {
        return null;
      }

      // Re-apply deterministic option order
      const optionMap = new Map(originalQ.options.map((opt) => [opt.key, opt]));
      const orderedOptions = sq.optionKeysOrder
        .map((key) => optionMap.get(key))
        .filter((opt) => !!opt)
        .map((opt) => ({
          key: opt!.key,
          text: opt!.text,
          isCorrect: opt!.isCorrect, // Include correct flag for review
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
    }).filter((q) => q !== null);

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
    const questions = await this.questionModel.find({ _id: { $in: questionIds } }).exec();
    const questionMap = new Map<string, QuestionDocument>();
    questions.forEach((q) => questionMap.set((q._id as Types.ObjectId).toString(), q));

    const sanitizedQuestions = attempt.shuffledQuestions.map((sq) => {
      const qIdStr = sq.questionId.toString();
      const originalQ = questionMap.get(qIdStr);

      if (!originalQ) return null;

      const optionMap = new Map(originalQ.options.map((opt) => [opt.key, opt]));
      const orderedOptions = sq.optionKeysOrder
        .map((key) => optionMap.get(key))
        .filter((opt) => !!opt)
        .map((opt) => ({
          key: opt!.key,
          text: opt!.text,
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
    }).filter((q) => q !== null);

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
