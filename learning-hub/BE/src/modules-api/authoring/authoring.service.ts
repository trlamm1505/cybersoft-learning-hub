import {
  Injectable,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Lesson,
  LessonDocument,
} from '../../modules-system/database/schemas/lesson.schema';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ImportLessonDto } from './dto/import-lesson.dto';
import { INITIAL_EXERCISES } from '../../data/initial-exercises';
import { INITIAL_HINTS } from '../../data/initial-hints';
import { INITIAL_BLOCK_LESSONS } from '../../data/initial-block-lessons';

@Injectable()
export class AuthoringService implements OnModuleInit {
  constructor(
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
  ) {}

  async onModuleInit() {
    await this.seedSystemLessons();
  }

  async seedSystemLessons() {
    try {
      // 1. Seed System Coding Exercises
      for (const ex of INITIAL_EXERCISES) {
        const existing = await this.lessonModel
          .findOne({ slug: ex.slug })
          .exec();
        if (!existing) {
          const hintsForSlug = INITIAL_HINTS.filter(
            (h) => h.exerciseSlug === ex.slug,
          );
          const h1 = hintsForSlug.find((h) => h.level === 1)?.content || '';
          const h2 = hintsForSlug.find((h) => h.level === 2)?.content || '';
          const h3 =
            hintsForSlug.find((h) => h.level === 3)?.content ||
            ex.solutionCode ||
            '';

          await this.lessonModel.create({
            title: ex.title,
            slug: ex.slug,
            description: ex.description,
            content: ex.description,
            type: 'coding',
            status: 'published',
            difficulty: ex.difficulty,
            points: ex.points,
            learningOutcome: `Hiểu và giải quyết thành công bài tập "${ex.title}" bằng tư duy thuật toán tối ưu.`,
            starterCode: ex.starterCode,
            solutionCode: ex.solutionCode,
            testCases: ex.testCases,
            hints: {
              hint1: h1,
              hint2: h2,
              hint3: h3,
            },
          });
        }
      }

      // 2. Seed Block Puzzle lessons (Ngày 13 — computational thinking cho lớp 3-5)
      for (const b of INITIAL_BLOCK_LESSONS) {
        const existing = await this.lessonModel
          .findOne({ slug: b.slug })
          .exec();
        if (!existing) {
          await this.lessonModel.create({
            ...b,
            type: 'block',
            status: 'published',
          } as any);
        }
      }
    } catch (e) {
      console.error('Error seeding system lessons into Mongo:', e);
    }
  }

  /**
   * Validate if lesson meets publication standards (learningOutcome + testCases/quizQuestions)
   */
  validatePublicationEligibility(lessonData: Partial<Lesson>): void {
    const outcome = lessonData.learningOutcome?.trim();
    if (!outcome) {
      throw new BadRequestException(
        'Không thể xuất bản bài học: Thiếu chuẩn đầu ra (learningOutcome).',
      );
    }

    const type = lessonData.type || 'coding';
    if (type === 'coding') {
      const testCases = lessonData.testCases || [];
      if (testCases.length === 0) {
        throw new BadRequestException(
          'Không thể xuất bản bài học lập trình (coding): Cần ít nhất 1 bài kiểm tra (testCases).',
        );
      }
      const hasValidTestCase = testCases.some(
        (tc) => tc.input !== undefined && tc.expectedOutput !== undefined,
      );
      if (!hasValidTestCase) {
        throw new BadRequestException(
          'Không thể xuất bản bài học lập trình (coding): Bài kiểm tra không hợp lệ.',
        );
      }
    } else if (type === 'quiz') {
      const questions = lessonData.quizQuestions || [];
      if (questions.length === 0) {
        throw new BadRequestException(
          'Không thể xuất bản bài học trắc nghiệm (quiz): Cần ít nhất 1 câu hỏi (quizQuestions).',
        );
      }
      const allHaveCorrectAnswer = questions.every(
        (q) => q.options && q.options.some((opt) => opt.isCorrect === true),
      );
      if (!allHaveCorrectAnswer) {
        throw new BadRequestException(
          'Không thể xuất bản bài học trắc nghiệm: Mỗi câu hỏi phải chứa ít nhất 1 đáp án đúng.',
        );
      }
    } else if (type === 'block') {
      const puzzle = lessonData.blockPuzzle;
      if (
        !puzzle ||
        !puzzle.availableBlocks ||
        puzzle.availableBlocks.length === 0
      ) {
        throw new BadRequestException(
          'Không thể xuất bản bài học Block Puzzle: Cần cấu hình blockPuzzle với ít nhất 1 khối lệnh (availableBlocks).',
        );
      }
      if (!puzzle.goalPosition) {
        throw new BadRequestException(
          'Không thể xuất bản bài học Block Puzzle: Cần khai báo vị trí đích (goalPosition).',
        );
      }
    }
  }

  /**
   * Helper to sanitize payload strictly according to lesson type (coding vs quiz)
   */
  private sanitizePayloadByType(data: any): any {
    if (data.type === 'quiz') {
      return {
        ...data,
        content: '',
        starterCode: '',
        solutionCode: '',
        testCases: [],
        blockPuzzle: undefined,
        hints: { hint1: '', hint2: '', hint3: '' },
      };
    }
    if (data.type === 'block') {
      return {
        ...data,
        content: '',
        starterCode: '',
        solutionCode: '',
        testCases: [],
        quizQuestions: [],
      };
    }
    return {
      ...data,
      type: 'coding',
      quizQuestions: [],
      blockPuzzle: undefined,
    };
  }

  async createLesson(dto: CreateLessonDto): Promise<LessonDocument> {
    const existing = await this.lessonModel.findOne({ slug: dto.slug }).exec();
    if (existing) {
      throw new BadRequestException(
        `Slug '${dto.slug}' đã tồn tại trong hệ thống.`,
      );
    }

    const sanitized = this.sanitizePayloadByType(dto);
    const status = sanitized.status || 'draft';
    if (status === 'published') {
      this.validatePublicationEligibility(sanitized);
    }

    const createdLesson = new this.lessonModel({
      ...sanitized,
      status,
    });
    return createdLesson.save();
  }

  async updateLesson(
    id: string,
    dto: UpdateLessonDto,
  ): Promise<LessonDocument> {
    const lesson = await this.lessonModel.findById(id).exec();
    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học với ID: ${id}`);
    }

    const sanitized = this.sanitizePayloadByType({
      ...lesson.toObject(),
      ...dto,
    });

    const targetStatus = dto.status || lesson.status;
    if (targetStatus === 'published') {
      this.validatePublicationEligibility(sanitized);
    }

    const updated = await this.lessonModel
      .findByIdAndUpdate(id, { $set: sanitized }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Cập nhật bài học thất bại cho ID: ${id}`);
    }
    return updated;
  }

  async findAll(forStudent?: boolean): Promise<LessonDocument[]> {
    const filter: any = forStudent ? { status: { $ne: 'draft' } } : {};
    const lessons = await this.lessonModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // `forStudent=true` là route CÔNG KHAI (không yêu cầu đăng nhập, dùng để
    // hiển thị catalog/preview) — phải ẩn solutionCode, expectedOutput của
    // hidden testCase, và isCorrect/explanation của quizQuestions, đúng như
    // exercise.service.ts đã làm cho hệ thống Exercise thật. Trước bản sửa
    // này, findAll trả nguyên toàn bộ document, lộ đáp án cho mọi bài giáo
    // viên tạo mà không cần đăng nhập hay biết ID cụ thể.
    if (forStudent) {
      return lessons.map((l) =>
        this.stripLearnerSensitiveFields(l),
      ) as LessonDocument[];
    }
    return lessons as LessonDocument[];
  }

  private stripLearnerSensitiveFields(lesson: any): any {
    const sanitized: any = { ...lesson, solutionCode: undefined };

    if (Array.isArray(lesson.testCases)) {
      sanitized.testCases = lesson.testCases.map((tc: any) =>
        tc.isHidden ? { isHidden: true } : tc,
      );
    }

    if (Array.isArray(lesson.quizQuestions)) {
      sanitized.quizQuestions = lesson.quizQuestions.map((q: any) => ({
        ...q,
        explanation: undefined,
        options: Array.isArray(q.options)
          ? q.options.map((opt: any) => ({ key: opt.key, text: opt.text }))
          : q.options,
      }));
    }

    return sanitized;
  }

  async findOne(id: string): Promise<LessonDocument> {
    const lesson = await this.lessonModel.findById(id).exec();
    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học với ID: ${id}`);
    }
    return lesson;
  }

  async exportLessonJson(id: string) {
    const lesson = await this.findOne(id);
    const lessonObj = lesson.toObject();

    const isCoding = lessonObj.type === 'coding';
    const isQuiz = lessonObj.type === 'quiz';
    const isBlock = lessonObj.type === 'block';

    const lessonData: any = {
      title: lessonObj.title,
      slug: lessonObj.slug,
      description: lessonObj.description || '',
      type: lessonObj.type,
      status: lessonObj.status,
      learningOutcome: lessonObj.learningOutcome || '',
      difficulty: lessonObj.difficulty,
      points: lessonObj.points,
    };

    if (isCoding) {
      lessonData.content = lessonObj.content || '';
      lessonData.starterCode = lessonObj.starterCode || '';
      lessonData.solutionCode = lessonObj.solutionCode || '';
      lessonData.testCases = lessonObj.testCases || [];
      if (lessonObj.hints) {
        lessonData.hints = lessonObj.hints;
      }
    } else if (isQuiz) {
      lessonData.quizQuestions = lessonObj.quizQuestions || [];
    } else if (isBlock) {
      lessonData.blockPuzzle = lessonObj.blockPuzzle || null;
      if (lessonObj.hints) {
        lessonData.hints = lessonObj.hints;
      }
    }

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      lessonData,
    };
  }

  async importLessonJson(dto: ImportLessonDto): Promise<LessonDocument> {
    const data = dto.lessonData;
    if (!data || !data.title || !data.slug || !data.type) {
      throw new BadRequestException(
        'Dữ liệu JSON không hợp lệ: Cần chứa title, slug và type.',
      );
    }

    // If slug exists, append dynamic timestamp to prevent conflict during import
    let slug = data.slug;
    const existing = await this.lessonModel.findOne({ slug }).exec();
    if (existing) {
      slug = `${data.slug}-imported-${Date.now()}`;
    }

    const sanitizedData = this.sanitizePayloadByType(data);

    const importDto: CreateLessonDto = {
      ...sanitizedData,
      slug,
      status: data.status || 'draft',
    };

    return this.createLesson(importDto);
  }

  async deleteLesson(id: string): Promise<{ message: string }> {
    const lesson = await this.lessonModel.findById(id).exec();
    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học với ID: ${id}`);
    }
    await this.lessonModel.findByIdAndDelete(id).exec();
    return { message: `Đã xóa bài học '${lesson.title}' thành công.` };
  }
}
