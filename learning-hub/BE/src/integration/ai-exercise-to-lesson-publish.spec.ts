/**
 * Integration test mô phỏng ĐÚNG luồng nghiệp vụ báo lỗi ban đầu:
 *   1. AI Problem Generator sinh 1 draft (StubProblemGeneratorClient, không
 *      cần Gemini thật) và giáo viên bấm "Lưu vào ngân hàng đề"
 *      (ProblemGeneratorService.saveDraft) -> ghi vào collection `exercises`.
 *   2. Giáo viên vào "Xem Các Bài Thi", thấy bài đó xuất hiện như một
 *      "exercise mồ côi" (AuthoringService.findAll gộp exercises chưa có
 *      lesson tương ứng), bấm "Sửa" rồi bấm "Xuất bản"
 *      (AuthoringService.updateLesson với status: 'published').
 *   3. Publish PHẢI thành công — đây là nguyên nhân gốc đã sửa: trước đây
 *      exercise mồ côi luôn nhận learningOutcome rỗng ('') khi map sang
 *      Lesson, khiến validatePublicationEligibility() luôn throw
 *      BadRequestException ngay cả khi giáo viên không đổi gì thêm.
 *
 * Dùng fake in-memory Mongoose Model (có state thật giữa các bước, không
 * phải mock trả cố định) để 2 service thực sự đọc/ghi CHUNG một "database"
 * giả lập — đúng tinh thần integration test giữa 2 module, không cần
 * mongodb-memory-server (không có sẵn trong devDependencies) hay kết nối
 * Mongo thật (tránh làm bẩn dữ liệu môi trường dev khi chạy CI).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { DatasetIntegrationService } from './dataset-integration.service';
import { ProblemGeneratorService } from '../modules-api/problem-generator/problem-generator.service';
import { AuthoringService } from '../modules-api/authoring/authoring.service';
import { Exercise } from '../modules-system/database/schemas/exercise.schema';
import { Lesson } from '../modules-system/database/schemas/lesson.schema';

// Luồng đầy đủ chạy validator Python thật cho bài AI sinh; khi Jest chạy
// nhiều worker song song, mức 5s mặc định bị vượt dù logic đúng.
jest.setTimeout(15000);

/**
 * Fake Mongoose Model tối giản: lưu document trong một mảng in-memory,
 * implement đúng subset các method 2 service thật sự gọi
 * (find/findOne/findById/create/findOneAndUpdate/deleteOne/findByIdAndDelete),
 * mỗi query trả object có `.exec()`/`.lean()`/`.select()` chainable giống
 * Mongoose thật, để service code không cần biết đây là fake.
 */
function createFakeModel<T extends { _id?: string }>() {
  const store: T[] = [];
  let counter = 1;

  function nextId() {
    return `fake-id-${counter++}`;
  }

  function matches(doc: any, filter: any): boolean {
    return Object.entries(filter || {}).every(([key, value]) => {
      if (value && typeof value === 'object' && '$nin' in (value as any)) {
        return !(value as any).$nin.includes(doc[key]);
      }
      if (value && typeof value === 'object' && '$in' in (value as any)) {
        return (value as any).$in.includes(doc[key]);
      }
      if (value && typeof value === 'object' && '$exists' in (value as any)) {
        return (doc[key] !== undefined) === (value as any).$exists;
      }
      return doc[key] === value;
    });
  }

  // Cả .lean() và .exec() đều phải trả object CÓ THỂ .then() (Promise) ĐỒNG
  // THỜI có thể tiếp tục chain thêm .exec()/.lean() — Mongoose thật cho phép
  // gọi theo bất kỳ thứ tự nào (`.sort().lean().exec()` hay `.lean().exec()`
  // hay chỉ `.exec()`), code thật trong repo dùng cả hai kiểu.
  function chainable<R>(resolveValue: R): any {
    const promise: any = Promise.resolve(resolveValue);
    promise.select = () => chainable(resolveValue);
    promise.sort = () => chainable(resolveValue);
    promise.lean = () => chainable(resolveValue);
    promise.exec = () => Promise.resolve(resolveValue);
    return promise;
  }

  const model: any = function (this: any, data: any) {
    Object.assign(this, data);
    this.save = async () => {
      if (!this._id) this._id = nextId();
      const idx = store.findIndex((d: any) => d._id === this._id);
      const plain = { ...this };
      delete plain.save;
      delete plain.toObject;
      if (idx >= 0) store[idx] = plain as T;
      else store.push(plain as T);
      return { ...plain, toObject: () => ({ ...plain }) };
    };
    this.toObject = () => {
      const plain = { ...this };
      delete plain.save;
      delete plain.toObject;
      return plain;
    };
  };

  model.find = (filter: any = {}) =>
    chainable(store.filter((d) => matches(d, filter)).map((d) => ({ ...d })));

  model.findOne = (filter: any = {}) => {
    const found = store.find((d) => matches(d, filter));
    return chainable(found ? { ...found } : null);
  };

  model.findById = (id: string) => {
    const found = store.find((d: any) => d._id === id);
    if (!found) return chainable(null);
    const plain = { ...found } as any;
    return {
      ...chainable(plain),
      exec: async () => ({ ...plain, toObject: () => ({ ...plain }) }),
    };
  };

  model.create = async (data: any) => {
    const doc = { ...data, _id: nextId() };
    store.push(doc);
    return { ...doc };
  };

  model.findOneAndUpdate = async (filter: any, update: any, options: any = {}) => {
    const idx = store.findIndex((d) => matches(d, filter));
    const setFields = update.$set || update;
    if (idx >= 0) {
      store[idx] = { ...store[idx], ...setFields };
      return { ...store[idx] };
    }
    if (options.upsert) {
      const doc = { ...filter, ...setFields, _id: nextId() };
      store.push(doc);
      return { ...doc };
    }
    return null;
  };

  model.findByIdAndUpdate = (id: string, update: any) => {
    const idx = store.findIndex((d: any) => d._id === id);
    if (idx < 0) return chainable(null);
    const setFields = update.$set || update;
    store[idx] = { ...store[idx], ...setFields };
    const updated = { ...store[idx] } as any;
    return chainable({ ...updated, toObject: () => ({ ...updated }) });
  };

  model.deleteOne = async (filter: any) => {
    const idx = store.findIndex((d) => matches(d, filter));
    if (idx >= 0) store.splice(idx, 1);
    return { deletedCount: idx >= 0 ? 1 : 0 };
  };

  model.findByIdAndDelete = (id: string) => {
    const idx = store.findIndex((d: any) => d._id === id);
    let removed: any = null;
    if (idx >= 0) removed = store.splice(idx, 1)[0];
    return { exec: async () => (removed ? { ...removed } : null) };
  };

  model.__store = store;

  return model;
}

describe('Integration: AI-generated exercise -> save to bank -> pull into Lesson -> Publish', () => {
  let problemGeneratorService: ProblemGeneratorService;
  let authoringService: AuthoringService;
  let fakeExerciseModel: ReturnType<typeof createFakeModel>;
  let fakeLessonModel: ReturnType<typeof createFakeModel>;

  beforeEach(async () => {
    fakeExerciseModel = createFakeModel();
    fakeLessonModel = createFakeModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProblemGeneratorService,
        AuthoringService,
        { provide: ConfigService, useValue: { get: () => undefined } }, // no GEMINI_API_KEY -> StubProblemGeneratorClient
        { provide: getModelToken(Exercise.name), useValue: fakeExerciseModel },
        { provide: getModelToken(Lesson.name), useValue: fakeLessonModel },
        {
          provide: DatasetIntegrationService,
          useValue: {
            fetchResourceCatalog: jest.fn().mockResolvedValue([]),
            fetchResourceVersionContract: jest.fn().mockImplementation((id, ver) =>
              Promise.resolve({
                resource_id: id,
                version: ver || 'v1.0',
                assignedResourceVersion: ver || 'v1.0',
              }),
            ),
          },
        },
      ],
    }).compile();

    problemGeneratorService = module.get(ProblemGeneratorService);
    authoringService = module.get(AuthoringService);
  });

  it('cả luồng đầy đủ: sinh bài AI -> lưu ngân hàng đề -> sửa từ Library -> publish thành công', async () => {
    // Bước 1: AI sinh 1 draft cho learning outcome về vòng lặp, rồi giáo viên
    // bấm "Lưu vào ngân hàng đề".
    const generated = await problemGeneratorService.generateMany([
      {
        learningOutcome: 'Vận dụng vòng lặp for để tính tổng có điều kiện',
        level: 'EASY',
        constraints: [],
        tags: ['loop'],
      },
    ]);

    expect(generated.errors).toEqual([]);
    expect(generated.results.length).toBe(1);
    const draft = generated.results[0].draft;
    expect(generated.results[0].validation.readyForReview).toBe(true);

    const saved = await problemGeneratorService.saveDraft(draft);
    expect(saved.slug).toBe(draft.slug);

    // Xác nhận bài thật sự nằm trong `exercises`, KHÔNG có bản ghi tương ứng
    // trong `lessons` — đúng trạng thái "exercise mồ côi" trước khi publish.
    const exerciseInBank = fakeExerciseModel.__store.find((e: any) => e.slug === draft.slug);
    expect(exerciseInBank).toBeDefined();
    expect(fakeLessonModel.__store.find((l: any) => l.slug === draft.slug)).toBeUndefined();

    // Bước 2: Giáo viên mở "Xem Các Bài Thi" -> findAll() phải gộp bài này
    // vào danh sách hiển thị, VÀ (điểm mấu chốt của bug fix) learningOutcome
    // không còn là chuỗi rỗng nữa.
    const library = await authoringService.findAll(false);
    const orphanEntry = library.find((l: any) => l.slug === draft.slug);
    expect(orphanEntry).toBeDefined();
    expect((orphanEntry as any).learningOutcome?.trim().length).toBeGreaterThan(0);
    expect((orphanEntry as any).sourceCollection).toBe('exercise');

    // Bước 3: Giáo viên bấm "Sửa" rồi "Xuất bản" — gọi updateLesson với
    // chính _id của exercise đó (đúng luồng thật FE dùng: lesson._id trong
    // trường hợp này là ObjectId của Exercise, vì library gộp chung 2 nguồn).
    const requester = { sub: 'teacher-integration-test', role: 'TEACHER' };
    const published = await authoringService.updateLesson(
      String((exerciseInBank as any)._id),
      { status: 'published' } as any,
      requester,
    );

    expect(published.status).toBe('published');
    expect(published.title).toBe(draft.title);
    expect(published.learningOutcome?.trim().length).toBeGreaterThan(0);

    // Publish thành công phải tạo một bản ghi Lesson thật (không throw), và
    // đồng bộ ngược sang exercises với đúng slug ban đầu (không đổi hậu tố vì
    // đây là chính exercise gốc, không có ai khác chiếm slug).
    const lessonDoc = fakeLessonModel.__store.find((l: any) => l.slug === draft.slug);
    expect(lessonDoc).toBeDefined();
    expect((lessonDoc as any).status).toBe('published');

    const syncedExercise = fakeExerciseModel.__store.find(
      (e: any) => e.slug === draft.slug,
    );
    expect((syncedExercise as any).sourceLessonSlug).toBe(draft.slug);
  });

  it('không throw BadRequestException khi publish bài mồ côi mà giáo viên không tự sửa learningOutcome (regression cho bug đã fix)', async () => {
    const generated = await problemGeneratorService.generateMany([
      {
        learningOutcome: 'Kiểm tra chuỗi đối xứng (palindrome)',
        level: 'EASY',
        constraints: [],
        tags: ['string'],
      },
    ]);
    const draft = generated.results[0].draft;
    await problemGeneratorService.saveDraft(draft);

    const exerciseInBank = fakeExerciseModel.__store.find((e: any) => e.slug === draft.slug);
    const requester = { sub: 'teacher-integration-test', role: 'TEACHER' };

    // dto KHÔNG chứa learningOutcome — mô phỏng đúng việc giáo viên bấm
    // Publish ngay mà quên/không biết cần tự gõ lại field này.
    await expect(
      authoringService.updateLesson(
        String((exerciseInBank as any)._id),
        { status: 'published' } as any,
        requester,
      ),
    ).resolves.toBeDefined();
  });

  it('vẫn throw BadRequestException rõ ràng nếu bài thật sự thiếu solutionCode (pre-publish check hoạt động đúng)', async () => {
    // Dựng thẳng 1 exercise mồ côi KHÔNG có solutionCode (mô phỏng dữ liệu
    // hỏng/nhập tay thiếu, không qua AI Tạo Đề) để xác nhận check field vẫn
    // chặn đúng case thật sự thiếu dữ liệu, không phải lúc nào cũng cho qua.
    const orphan = await fakeExerciseModel.create({
      title: 'Bai thieu solution',
      slug: 'bai-thieu-solution',
      description: 'Mo ta',
      difficulty: 'EASY',
      starterCode: '',
      solutionCode: '',
      testCases: [{ input: '1', expectedOutput: '1', isHidden: false }],
      tags: [],
    });

    const requester = { sub: 'teacher-integration-test', role: 'TEACHER' };
    await expect(
      authoringService.updateLesson(
        String(orphan._id),
        { status: 'published' } as any,
        requester,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
