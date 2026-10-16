import {
  Injectable,
  BadRequestException,
  ForbiddenException,
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
import { stripControlChars } from '../../common/utils/sanitize-text-input.util';
import { DatasetIntegrationService } from '../../integration/dataset-integration.service';

@Injectable()
export class AuthoringService implements OnModuleInit {
  constructor(
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    private readonly datasetIntegrationService: DatasetIntegrationService,
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

  // Giá trị authorId mặc định của schema (Lesson.authorId default: 'teacher-1')
  // — lesson seed sẵn (INITIAL_EXERCISES, INITIAL_BLOCK_LESSONS) hoặc tạo bởi
  // các bản cũ trước khi có ownership check đều mang giá trị này. Coi đây là
  // "tài nguyên dùng chung của hệ sinh thái", KHÔNG phải sở hữu riêng của một
  // giáo viên cụ thể nào — mọi TEACHER đều được sửa, tránh việc enforce
  // ownership chặt làm khoá cứng toàn bộ nội dung seed khỏi mọi giáo viên
  // thật (không ai có sub === 'teacher-1').
  private static readonly SHARED_AUTHOR_ID = 'teacher-1';

  /**
   * Chặn TEACHER sửa/xoá/xem chi tiết lesson KHÔNG do chính họ tạo và KHÔNG
   * phải tài nguyên dùng chung (SHARED_AUTHOR_ID) — vá lỗ hổng IDOR "giáo
   * viên A đoán/biết ObjectId của giáo viên B là sửa/xoá được ngay". ADMIN
   * bỏ qua mọi kiểm tra này, được xem/duyệt toàn bộ theo đúng yêu cầu.
   */
  private assertCanModify(
    lesson: { authorId?: string },
    requester: { sub: string; role: string },
  ): void {
    if (requester.role === 'ADMIN') return;
    const owner = lesson.authorId || AuthoringService.SHARED_AUTHOR_ID;
    if (owner === AuthoringService.SHARED_AUTHOR_ID) return;
    if (owner !== requester.sub) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác trên bài học này — bài thuộc sở hữu của giáo viên khác.',
      );
    }
  }

  /**
   * Validate if lesson meets publication standards (learningOutcome + testCases/quizQuestions)
   */
  validatePublicationEligibility(lessonData: Partial<Lesson>): void {
    if (!lessonData.title?.trim()) {
      throw new BadRequestException(
        'Không thể xuất bản bài học: Thiếu tiêu đề (title).',
      );
    }

    const outcome = lessonData.learningOutcome?.trim();
    if (!outcome) {
      throw new BadRequestException(
        'Không thể xuất bản bài học: Thiếu chuẩn đầu ra (learningOutcome).',
      );
    }

    const type = lessonData.type || 'coding';
    if (type === 'coding') {
      if (!lessonData.solutionCode?.trim()) {
        throw new BadRequestException(
          'Không thể xuất bản bài học lập trình (coding): Thiếu lời giải mẫu (solutionCode).',
        );
      }
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
          'Không thể xuất bản bài học lập trình (coding): Bài kiểm tra không hợp lệ — mỗi test case cần có input và expectedOutput.',
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
   * Helper to sanitize payload strictly according to lesson type (coding vs quiz).
   *
   * Cũng loại bỏ ký tự điều khiển ẩn khỏi các field văn bản tự do (title,
   * description, learningOutcome, content) trước khi lưu DB — Admin/Teacher
   * nhập những field này tự do, ký tự điều khiển ẩn có thể dùng để chèn
   * escape sequence/ẩn nội dung. KHÔNG cắt độ dài (dùng stripControlChars,
   * không phải sanitizeFreeformText) vì content bài học có thể hợp lệ dài.
   * Không cần thêm gì cho XSS: FE render các field này như text thuần (không
   * dùng dangerouslySetInnerHTML ở đâu), React tự escape khi hiển thị.
   */
  private sanitizePayloadByType(data: any): any {
    const cleanedBase = {
      ...data,
      title: stripControlChars(data.title),
      description: stripControlChars(data.description),
      learningOutcome: stripControlChars(data.learningOutcome),
    };

    if (cleanedBase.type === 'quiz') {
      return {
        ...cleanedBase,
        content: '',
        starterCode: '',
        solutionCode: '',
        testCases: [],
        blockPuzzle: undefined,
        hints: { hint1: '', hint2: '', hint3: '' },
      };
    }
    if (cleanedBase.type === 'block') {
      return {
        ...cleanedBase,
        content: '',
        starterCode: '',
        solutionCode: '',
        testCases: [],
        quizQuestions: [],
      };
    }
    return {
      ...cleanedBase,
      type: 'coding',
      content: stripControlChars(cleanedBase.content),
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
   * An toàn ghi đè: chỉ upsert theo `slug` khi exercise cùng slug đã tồn tại
   * KHÔNG có chủ, hoặc có `sourceLessonSlug` khớp đúng lesson này (tức chính
   * lesson này đã tạo/đồng bộ bản ghi đó ở lần publish trước — an toàn để tự
   * cập nhật lại). Nếu slug đã bị một nguồn KHÁC chiếm (bài do AI Tạo Đề lưu
   * trực tiếp qua saveDraft(), hoặc lesson khác từng đồng bộ slug này trước
   * khi có field sourceLessonSlug), KHÔNG ghi đè âm thầm — tự sinh slug hậu
   * tố `${slug}-2`, `${slug}-3`... cho bản ghi exercise của lesson này, và
   * cảnh báo rõ trong log để người vận hành biết có xung đột slug cần xem
   * lại. KHÔNG throw nếu lỗi — publish lesson vẫn phải thành công ngay cả
   * khi đồng bộ sang exercises thất bại (ví dụ lỗi mạng DB tạm thời), lỗi
   * chỉ được log lại.
   */
  private async syncPublishedCodingLessonToExerciseBank(
    lesson: LessonDocument,
  ): Promise<void> {
    if (lesson.type !== 'coding' || lesson.status !== 'published') return;

    try {
      const existing = await this.exerciseModel
        .findOne({ slug: lesson.slug })
        .select('slug sourceLessonSlug')
        .lean();

      const ownedByThisLesson =
        !existing || existing.sourceLessonSlug === lesson.slug;

      const targetSlug = ownedByThisLesson
        ? lesson.slug
        : await this.findAvailableExerciseSlug(lesson.slug);

      if (!ownedByThisLesson) {
        console.warn(
          `Slug exercise "${lesson.slug}" đã bị nguồn khác chiếm (không có sourceLessonSlug khớp lesson này) — ` +
            `đồng bộ lesson "${lesson.slug}" sang slug thay thế "${targetSlug}" thay vì ghi đè.`,
        );
      }

      await this.exerciseModel.findOneAndUpdate(
        { slug: targetSlug },
        {
          $set: {
            title: lesson.title,
            slug: targetSlug,
            description: lesson.content || lesson.description || '',
            type: 'CODE_TEXT',
            difficulty: lesson.difficulty,
            points: lesson.points,
            starterCode: lesson.starterCode || '',
            solutionCode: lesson.solutionCode || '',
            testCases: lesson.testCases || [],
            sourceLessonSlug: lesson.slug,
            resource_id: lesson.resource_id,
            resource_version: lesson.resource_version,
            assignedResourceVersion: lesson.assignedResourceVersion,
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

  /**
   * Tìm slug còn trống dạng `${baseSlug}-2`, `${baseSlug}-3`... để tránh
   * ghi đè một exercise slug đã có chủ khác. Bắt đầu từ hậu tố 2 (không phải
   * 1) vì bản gốc không có hậu tố được xem như "phiên bản 1" ngầm định.
   */
  private async findAvailableExerciseSlug(baseSlug: string): Promise<string> {
    for (let suffix = 2; suffix < 1000; suffix++) {
      const candidate = `${baseSlug}-${suffix}`;
      const taken = await this.exerciseModel
        .findOne({ slug: candidate })
        .select('_id')
        .lean();
      if (!taken) return candidate;
    }
    // Về lý thuyết không thể xảy ra (1000 lesson trùng slug cùng lúc) —
    // fallback an toàn để không lặp vô hạn.
    return `${baseSlug}-${Date.now()}`;
  }

  async getCatalogResources() {
    return this.datasetIntegrationService.fetchResourceCatalog();
  }

  async createLesson(
    dto: CreateLessonDto,
    authorId: string,
  ): Promise<LessonDocument> {
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

    let resourceVersionInfo: Record<string, string> = {};
    if (dto.resource_id) {
      const contractInfo =
        await this.datasetIntegrationService.fetchResourceVersionContract(
          dto.resource_id,
          dto.resource_version,
        );
      resourceVersionInfo = {
        resource_id: contractInfo.resource_id,
        resource_version: contractInfo.version,
        assignedResourceVersion: contractInfo.assignedResourceVersion,
      };
    }

    const createdLesson = new this.lessonModel({
      ...sanitized,
      ...resourceVersionInfo,
      status,
      // authorId luôn lấy từ JWT của người gọi (controller truyền vào),
      // KHÔNG bao giờ từ dto client tự gửi — chặn IDOR mạo danh chủ sở hữu.
      authorId,
    });
    const saved = await createdLesson.save();
    await this.syncPublishedCodingLessonToExerciseBank(saved);
    return saved;
  }


  async updateLesson(
    id: string,
    dto: UpdateLessonDto,
    requester: { sub: string; role: string },
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
      // Bài DA Lab không phải lesson 'coding': không cho chuyển đổi tại đây.
      if (!exercise || exercise.resource_id) {
        throw new NotFoundException(`Không tìm thấy bài học với ID: ${id}`);
      }

      const asLessonPayload: any = {
        title: exercise.title,
        slug: exercise.slug,
        description: exercise.description,
        type: 'coding',
        status: 'draft',
        learningOutcome: this.defaultLearningOutcomeFor(exercise.title),
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
      // Exercise mồ côi không có field authorId (chỉ Lesson mới có) nên
      // không cần assertCanModify ở đây — mặc định coi là tài nguyên dùng
      // chung; người sửa đầu tiên trở thành authorId của bản Lesson mới.
      await this.exerciseModel.deleteOne({ _id: id });
      const created = new this.lessonModel({
        ...sanitized,
        status: targetStatus,
        authorId: requester.sub,
      });
      const saved = await created.save();
      await this.syncPublishedCodingLessonToExerciseBank(saved);
      return saved;
    }

    this.assertCanModify(lesson, requester);

    const sanitized = this.sanitizePayloadByType({
      ...lesson.toObject(),
      ...dto,
    });

    const targetStatus = dto.status || lesson.status;
    if (targetStatus === 'published') {
      this.validatePublicationEligibility(sanitized);
    }

    if (dto.resource_id !== undefined || dto.resource_version !== undefined) {
      const targetResourceId = dto.resource_id ?? lesson.resource_id;
      if (targetResourceId) {
        const contractInfo =
          await this.datasetIntegrationService.fetchResourceVersionContract(
            targetResourceId,
            dto.resource_version ?? lesson.resource_version,
          );
        sanitized.resource_id = contractInfo.resource_id;
        sanitized.resource_version = contractInfo.version;
        sanitized.assignedResourceVersion = contractInfo.assignedResourceVersion;
      }
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
    // Bài DA Lab (có resource_id) chấm bằng SQL trên sandbox ở module
    // da-labs, không phải bài Python: không được map thành lesson 'coding'.
    const orphanExercises = await this.exerciseModel
      .find({
        slug: { $nin: Array.from(lessonSlugs) },
        resource_id: { $exists: false },
      })
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
   * Sinh learningOutcome mặc định cho một Exercise "mồ côi" (do AI Tạo Đề
   * lưu thẳng vào `exercises`, không có field learningOutcome riêng theo
   * shape Lesson) — cùng công thức seedSystemLessons() đã dùng cho
   * INITIAL_EXERCISES (dòng ~64). Trước đây để rỗng ('') khiến
   * validatePublicationEligibility() LUÔN chặn Publish ngay khi giáo viên
   * "Sửa" một bài loại này mà chưa kịp tự gõ lại outcome — đây chính là
   * nguyên nhân gốc của bug "lấy bài từ ngân hàng đề ra không publish được".
   * Không throw/chặn gì ở đây — chỉ cấp một giá trị khởi điểm hợp lý để
   * giáo viên có thể publish ngay, và vẫn tự sửa lại nếu muốn.
   */
  private defaultLearningOutcomeFor(title: string): string {
    return `Hiểu và giải quyết thành công bài tập "${title}" bằng tư duy thuật toán tối ưu.`;
  }

  /**
   * Map một Exercise sang shape gần giống Lesson để trang "Xem Các Bài Thi"
   * hiển thị được chung 1 danh sách. Exercise không có field status —
   * coi mọi exercise là 'published' (đã hiển thị công khai cho học viên qua
   * Code Playground từ trước). learningOutcome được cấp giá trị mặc định
   * (xem defaultLearningOutcomeFor) thay vì để rỗng, để giáo viên "Sửa" bài
   * này không bị chặn Publish ngay lập tức.
   */
  private mapExerciseToLessonShape(ex: any): any {
    return {
      _id: ex._id,
      title: ex.title,
      slug: ex.slug,
      description: ex.description,
      type: 'coding',
      status: 'published',
      learningOutcome: this.defaultLearningOutcomeFor(ex.title),
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

  async findOne(
    id: string,
    requester: { sub: string; role: string },
  ): Promise<LessonDocument> {
    const lesson = await this.lessonModel.findById(id).exec();
    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học với ID: ${id}`);
    }
    this.assertCanModify(lesson, requester);
    return lesson;
  }

  async exportLessonJson(id: string, requester: { sub: string; role: string }) {
    const lesson = await this.findOne(id, requester);
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

  async importLessonJson(
    dto: ImportLessonDto,
    authorId: string,
  ): Promise<LessonDocument> {
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

    return this.createLesson(importDto, authorId);
  }

  async deleteLesson(
    id: string,
    requester: { sub: string; role: string },
  ): Promise<{ message: string }> {
    const lesson = await this.lessonModel.findById(id).exec();

    if (lesson) {
      this.assertCanModify(lesson, requester);
      await this.lessonModel.findByIdAndDelete(id).exec();

      // Xoá lesson coding không tự kéo theo xoá bản đồng bộ bên `exercises`
      // (ghi bởi syncPublishedCodingLessonToExerciseBank khi publish) — nếu
      // không xoá theo, học viên vẫn thấy bài này qua Code Playground/AI
      // Coach dù giáo viên đã xoá ở Soạn Thảo. Không throw nếu xoá exercises
      // lỗi, cùng lý do với sync lúc publish: việc xoá lesson vẫn phải
      // thành công.
      if (lesson.type === 'coding') {
        try {
          await this.exerciseModel.deleteOne({
            sourceLessonSlug: lesson.slug,
          });
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
    // Bài DA Lab không hiện trong Library nên cũng không xoá qua đường này.
    if (!exercise || exercise.resource_id) {
      throw new NotFoundException(`Không tìm thấy bài học với ID: ${id}`);
    }
    await this.exerciseModel.findByIdAndDelete(id).exec();
    return { message: `Đã xóa bài học '${exercise.title}' thành công.` };
  }
}
