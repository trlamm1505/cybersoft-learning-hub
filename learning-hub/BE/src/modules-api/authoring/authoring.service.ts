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
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
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
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
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

  /**
   * Đồng bộ một lesson type=coding VỪA PUBLISH sang collection `exercises` —
   * để Code Playground và AI Coach (đọc từ Exercise, không phải Lesson)
   * thấy được ngay bài giáo viên vừa soạn/xuất bản, thay vì lỗi "Không tìm
   * thấy bài tập" vì 2 collection trước đây hoàn toàn tách biệt.
   *
   * Dùng upsert theo `slug` (khớp đúng khoá unique của Exercise): nếu đã có
   * exercise cùng slug (kể cả bài do AI Tạo Đề sinh, hoặc bản đồng bộ từ
   * lần publish trước), ghi đè nội dung theo lesson mới nhất, không tạo
   * trùng bản ghi. KHÔNG throw nếu lỗi — publish lesson vẫn phải thành công
   * ngay cả khi đồng bộ sang exercises thất bại (ví dụ lỗi mạng DB tạm
   * thời), lỗi chỉ được log lại.
   */
  private async syncPublishedCodingLessonToExerciseBank(
    lesson: LessonDocument,
  ): Promise<void> {
    if (lesson.type !== 'coding' || lesson.status !== 'published') return;

    try {
      await this.exerciseModel.findOneAndUpdate(
        { slug: lesson.slug },
        {
          $set: {
            title: lesson.title,
            description: lesson.content || lesson.description || '',
            type: 'CODE_TEXT',
            difficulty: lesson.difficulty,
            points: lesson.points,
            starterCode: lesson.starterCode || '',
            solutionCode: lesson.solutionCode || '',
            testCases: lesson.testCases || [],
          },
        },
        { upsert: true, new: true },
      );
    } catch (err) {
      console.error(
        `Đồng bộ lesson "${lesson.slug}" sang exercises thất bại:`,
        err,
      );
    }
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
    const saved = await createdLesson.save();
    await this.syncPublishedCodingLessonToExerciseBank(saved);
    return saved;
  }

  async updateLesson(
    id: string,
    dto: UpdateLessonDto,
  ): Promise<LessonDocument> {
    const lesson = await this.lessonModel.findById(id).exec();

    if (!lesson) {
      // Cùng tình huống với deleteLesson(): id có thể thuộc về một exercise
      // "mồ côi" (chỉ tồn tại trong `exercises`, do AI Tạo Đề lưu thẳng) mà
      // findAll() đã gộp hiển thị trong Library với shape/_id của chính
      // exercise đó. Không có bản lesson tương ứng để "sửa tại chỗ" theo
      // đúng nghĩa updateLesson — tạo một lesson MỚI từ dữ liệu exercise đó
      // (kèm thay đổi trong dto), rồi để syncPublishedCodingLessonToExerciseBank
      // (gọi qua createLesson) đồng bộ ngược lại đúng slug, thay vì trả 404
      // khó hiểu cho một hàng trông y hệt lesson sửa được bình thường trên UI.
      const exercise = await this.exerciseModel.findById(id).exec();
      if (!exercise) {
        throw new NotFoundException(`Không tìm thấy bài học với ID: ${id}`);
      }

      const asLessonPayload: any = {
        title: exercise.title,
        slug: exercise.slug,
        description: exercise.description,
        type: 'coding',
        status: 'draft',
        learningOutcome: '',
        content: exercise.description,
        starterCode: exercise.starterCode,
        solutionCode: exercise.solutionCode,
        difficulty: exercise.difficulty,
        points: exercise.points,
        testCases: exercise.testCases,
        ...dto,
      };

      const sanitized = this.sanitizePayloadByType(asLessonPayload);
      const targetStatus = dto.status || 'draft';
      if (targetStatus === 'published') {
        this.validatePublicationEligibility(sanitized);
      }

      // Xoá exercise gốc trước khi tạo lesson cùng slug — createLesson()
      // chặn trùng slug, và exercise này sẽ được ghi lại ngay bởi
      // syncPublishedCodingLessonToExerciseBank nếu targetStatus published.
      await this.exerciseModel.deleteOne({ _id: id });
      const created = new this.lessonModel({ ...sanitized, status: targetStatus });
      const saved = await created.save();
      await this.syncPublishedCodingLessonToExerciseBank(saved);
      return saved;
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
    await this.syncPublishedCodingLessonToExerciseBank(updated);
    return updated;
  }

  async findAll(forStudent?: boolean): Promise<LessonDocument[]> {
    const filter: any = forStudent ? { status: { $ne: 'draft' } } : {};
    const lessons = await this.lessonModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Bài lưu THẲNG vào `exercises` (qua AI Tạo Đề, chưa từng "Chọn từ Ngân
    // hàng đề" -> Xuất bản trong Soạn Thảo) không có bản ghi tương ứng trong
    // `lessons` — trước đây findAll() chỉ đọc lessons nên trang "Xem Các Bài
    // Thi" hoàn toàn không thấy những bài này, giáo viên không quản lý
    // (sửa/xoá) được chúng. Gộp thêm các exercise CHƯA có slug trùng với bất
    // kỳ lesson nào (tránh liệt kê trùng bài đã đồng bộ 2 chiều) vào cùng
    // danh sách, đánh dấu `sourceCollection: 'exercise'` để FE phân biệt
    // được nguồn khi cần (ví dụ ẩn nút Import JSON không áp dụng được).
    const lessonSlugs = new Set(lessons.map((l) => l.slug));
    const orphanExercises = await this.exerciseModel
      .find({ slug: { $nin: Array.from(lessonSlugs) } })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const mappedExercises = orphanExercises.map((ex) =>
      this.mapExerciseToLessonShape(ex),
    );

    const combined = [...lessons, ...mappedExercises] as any[];

    // `forStudent=true` là route CÔNG KHAI (không yêu cầu đăng nhập, dùng để
    // hiển thị catalog/preview) — phải ẩn solutionCode, expectedOutput của
    // hidden testCase, và isCorrect/explanation của quizQuestions, đúng như
    // exercise.service.ts đã làm cho hệ thống Exercise thật. Trước bản sửa
    // này, findAll trả nguyên toàn bộ document, lộ đáp án cho mọi bài giáo
    // viên tạo mà không cần đăng nhập hay biết ID cụ thể.
    if (forStudent) {
      return combined.map((l) =>
        this.stripLearnerSensitiveFields(l),
      ) as LessonDocument[];
    }
    return combined as LessonDocument[];
  }

  /**
   * Map một Exercise sang shape gần giống Lesson để trang "Xem Các Bài Thi"
   * hiển thị được chung 1 danh sách. Exercise không có field status/
   * learningOutcome — coi mọi exercise là 'published' (đã hiển thị công
   * khai cho học viên qua Code Playground từ trước), learningOutcome để
   * rỗng vì AI Tạo Đề không thu thập field này riêng theo đúng shape Lesson.
   */
  private mapExerciseToLessonShape(ex: any): any {
    return {
      _id: ex._id,
      title: ex.title,
      slug: ex.slug,
      description: ex.description,
      type: 'coding',
      status: 'published',
      learningOutcome: '',
      content: ex.description,
      starterCode: ex.starterCode,
      solutionCode: ex.solutionCode,
      difficulty: ex.difficulty,
      points: ex.points,
      testCases: ex.testCases,
      quizQuestions: [],
      hints: ex.hints,
      createdAt: ex.createdAt,
      updatedAt: ex.updatedAt,
      sourceCollection: 'exercise',
    };
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

    if (lesson) {
      await this.lessonModel.findByIdAndDelete(id).exec();

      // Xoá lesson coding không tự kéo theo xoá bản đồng bộ bên `exercises`
      // (ghi bởi syncPublishedCodingLessonToExerciseBank khi publish) — nếu
      // không xoá theo, học viên vẫn thấy bài này qua Code Playground/AI
      // Coach dù giáo viên đã xoá ở Soạn Thảo. Không throw nếu xoá exercises
      // lỗi, cùng lý do với sync lúc publish: việc xoá lesson vẫn phải
      // thành công.
      if (lesson.type === 'coding') {
        try {
          await this.exerciseModel.deleteOne({ slug: lesson.slug });
        } catch (err) {
          console.error(
            `Xoá bản đồng bộ "${lesson.slug}" khỏi exercises thất bại:`,
            err,
          );
        }
      }

      return { message: `Đã xóa bài học '${lesson.title}' thành công.` };
    }

    // Không tìm thấy trong `lessons` — có thể đây là một bài chỉ tồn tại
    // trong `exercises` (do AI Tạo Đề lưu thẳng, chưa từng qua "Chọn từ Ngân
    // hàng đề" -> Xuất bản) mà findAll() đã gộp hiển thị chung danh sách
    // Library với cùng shape/_id của exercise đó. Thử xoá ở exercises trước
    // khi báo "không tìm thấy" — nếu không, trang Library sẽ không thể xoá
    // được những bài nó vừa gộp thêm vào chính danh sách của mình.
    const exercise = await this.exerciseModel.findById(id).exec();
    if (!exercise) {
      throw new NotFoundException(`Không tìm thấy bài học với ID: ${id}`);
    }
    await this.exerciseModel.findByIdAndDelete(id).exec();
    return { message: `Đã xóa bài học '${exercise.title}' thành công.` };
  }
}
