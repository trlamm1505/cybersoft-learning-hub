import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lesson, LessonDocument } from '../../modules-system/database/schemas/lesson.schema';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ImportLessonDto } from './dto/import-lesson.dto';
import { INITIAL_EXERCISES } from '../../data/initial-exercises';
import { INITIAL_HINTS } from '../../data/initial-hints';

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
        const existing = await this.lessonModel.findOne({ slug: ex.slug }).exec();
        if (!existing) {
          const hintsForSlug = INITIAL_HINTS.filter((h) => h.exerciseSlug === ex.slug);
          const h1 = hintsForSlug.find((h) => h.level === 1)?.content || '';
          const h2 = hintsForSlug.find((h) => h.level === 2)?.content || '';
          const h3 = hintsForSlug.find((h) => h.level === 3)?.content || ex.solutionCode || '';

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

      // 2. Seed System Quizzes
      const SYSTEM_QUIZZES = [
        {
          title: 'Bài Trắc Nghiệm Lập Trình Web Tổng Hợp',
          slug: 'standard-web',
          description:
            'Kiểm tra toàn diện kiến thức Lập trình Web (HTML5, CSS3, JavaScript ES6+, React Hooks, NestJS & MongoDB).',
          type: 'quiz',
          status: 'published',
          difficulty: 'MEDIUM',
          points: 100,
          learningOutcome: 'Đánh giá toàn diện kiến thức Fullstack Web Development.',
          content: 'Bài thi trắc nghiệm tổng hợp kiến thức Frontend & Backend.',
          starterCode: '',
          solutionCode: '',
          testCases: [],
          quizQuestions: [
            {
              content:
                'Trong HTML5, thẻ nào được dùng để định nghĩa thanh điều hướng chính của website?',
              options: [
                { key: 'A', text: '<nav>', isCorrect: true },
                { key: 'B', text: '<header>', isCorrect: false },
                { key: 'C', text: '<section>', isCorrect: false },
                { key: 'D', text: '<aside>', isCorrect: false },
              ],
              explanation: 'Thẻ <nav> trong HTML5 biểu thị khu vực chứa các liên kết điều hướng.',
              points: 10,
            },
            {
              content: 'Hook nào trong React dùng để thực hiện side effects (ví dụ fetch data)?',
              options: [
                { key: 'A', text: 'useState', isCorrect: false },
                { key: 'B', text: 'useEffect', isCorrect: true },
                { key: 'C', text: 'useContext', isCorrect: false },
                { key: 'D', text: 'useReducer', isCorrect: false },
              ],
              explanation: 'useEffect được gọi sau mỗi lần render để xử lý side-effects.',
              points: 10,
            },
          ],
        },
        {
          title: 'Bài Trắc Nghiệm Python Căn Bản',
          slug: 'python-basic',
          description:
            'Kiểm tra kiến thức cốt lõi Python: Biến, kiểu dữ liệu, hàm input(), cấu trúc lặp và xử lý chuỗi.',
          type: 'quiz',
          status: 'published',
          difficulty: 'EASY',
          points: 50,
          learningOutcome: 'Củng cố kiến thức nền tảng ngôn ngữ lập trình Python.',
          content: 'Bài trắc nghiệm các khái niệm cơ bản trong Python.',
          starterCode: '',
          solutionCode: '',
          testCases: [],
          quizQuestions: [
            {
              content:
                'Trong ngôn ngữ lập trình Python, hàm nào dùng để nhận dữ liệu nhập từ bàn phím?',
              codeSnippet: 'user_input = input("Nhập số: ")',
              options: [
                { key: 'A', text: 'input()', isCorrect: true },
                { key: 'B', text: 'readline()', isCorrect: false },
                { key: 'C', text: 'scan()', isCorrect: false },
                { key: 'D', text: 'get()', isCorrect: false },
              ],
              explanation:
                'Hàm input() trong Python dùng để đọc một dòng ký tự nhập từ bàn phím dưới dạng string.',
              points: 10,
            },
          ],
        },
      ];

      for (const q of SYSTEM_QUIZZES) {
        const existing = await this.lessonModel.findOne({ slug: q.slug }).exec();
        if (!existing) {
          await this.lessonModel.create(q as any);
        } else if (existing.type !== 'quiz' || !existing.quizQuestions || existing.quizQuestions.length === 0) {
          await this.lessonModel.updateOne(
            { slug: q.slug },
            { $set: { type: 'quiz', quizQuestions: q.quizQuestions } },
          );
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
      const allHaveCorrectAnswer = questions.every((q) =>
        q.options && q.options.some((opt) => opt.isCorrect === true),
      );
      if (!allHaveCorrectAnswer) {
        throw new BadRequestException(
          'Không thể xuất bản bài học trắc nghiệm: Mỗi câu hỏi phải chứa ít nhất 1 đáp án đúng.',
        );
      }
    }
  }

  /**
   * Helper to sanitize payload strictly according to lesson type (coding vs quiz)
   */
  private sanitizePayloadByType(data: any): any {
    const isQuiz = data.type === 'quiz';
    if (isQuiz) {
      return {
        ...data,
        content: '',
        starterCode: '',
        solutionCode: '',
        testCases: [],
        hints: { hint1: '', hint2: '', hint3: '' },
      };
    } else {
      return {
        ...data,
        type: 'coding',
        quizQuestions: [],
      };
    }
  }

  async createLesson(dto: CreateLessonDto): Promise<LessonDocument> {
    const existing = await this.lessonModel.findOne({ slug: dto.slug }).exec();
    if (existing) {
      throw new BadRequestException(`Slug '${dto.slug}' đã tồn tại trong hệ thống.`);
    }

    const sanitized = this.sanitizePayloadByType(dto);
    const status = sanitized.status || 'draft';
    if (status === 'published') {
      this.validatePublicationEligibility(sanitized as any);
    }

    const createdLesson = new this.lessonModel({
      ...sanitized,
      status,
    });
    return createdLesson.save();
  }

  async updateLesson(id: string, dto: UpdateLessonDto): Promise<LessonDocument> {
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
      this.validatePublicationEligibility(sanitized as any);
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
    return this.lessonModel.find(filter).sort({ createdAt: -1 }).exec();
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
