import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { LessonHints, LessonHintsSchema } from './lesson.schema';

export type ExerciseDocument = Exercise & Document;

@Schema({ _id: false })
export class ExerciseTestCase {
  @Prop({ required: true, type: String })
  input: string;

  // Not `required: true`: Mongoose's default String required-check treats '' as
  // missing, but '' is a legitimate expected output (e.g. "print nothing" cases).
  @Prop({ type: String })
  expectedOutput: string;

  @Prop({ type: Boolean, default: false })
  isHidden: boolean;

  @Prop({ type: Number })
  memoryLimitMb?: number;
}

export const ExerciseTestCaseSchema =
  SchemaFactory.createForClass(ExerciseTestCase);

/** Tiêu chí rubric của bài DA_INSIGHT (chấm bằng LLM, xem da-labs/insight-guardrails.ts). */
@Schema({ _id: false })
export class InsightRubricCriterion {
  @Prop({ required: true, type: String })
  id: string;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: Number })
  maxPoints: number;

  @Prop({ required: true, type: String })
  description: string;
}

export const InsightRubricCriterionSchema = SchemaFactory.createForClass(
  InsightRubricCriterion,
);

@Schema({ timestamps: true, collection: 'exercises' })
export class Exercise {
  @Prop({ required: true, type: String, trim: true })
  title: string;

  @Prop({ required: true, type: String, unique: true })
  slug: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({
    type: String,
    enum: ['QUIZ', 'CODE_BLOCK', 'CODE_TEXT', 'SQL_LAB', 'DA_INSIGHT', 'AI_LAB'],
    default: 'CODE_TEXT',
  })
  type: string;

  @Prop({ type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'EASY' })
  difficulty: string;

  @Prop({ type: Number, default: 10 })
  points: number;

  @Prop({ type: String, default: '' })
  starterCode: string;

  @Prop({ type: String })
  solutionCode?: string;

  @Prop({ type: Number, default: 2000 })
  timeLimitMs: number;

  @Prop({ type: Number, default: 128 })
  memoryLimitMb: number;

  @Prop({ type: [ExerciseTestCaseSchema], default: [] })
  testCases: ExerciseTestCase[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: String })
  prerequisiteSlug?: string;

  // Ma trận nhóm đối tượng x loại lab (xem modules-api/exercise/exercise-matrix.ts).
  // Bài cũ chưa có hai trường này; bài tạo/sửa qua /exercises và seed-matrix bắt buộc có.
  @Prop({ type: String, enum: ['K3_5', 'K6_9', 'K10_12', 'CAREER_ADULT'], index: true })
  targetGroup?: string;

  @Prop({
    type: String,
    enum: ['PUZZLE_BLOCK', 'PYTHON_CODE', 'ALGO_JUDGE', 'DATA_SQL', 'AI_PROMPT', 'TESTER_QA'],
  })
  labType?: string;

  // Bài K3_5 (PUZZLE_BLOCK): câu chuyện dẫn dắt và ảnh minh họa (URL https hoặc data URL ảnh nhỏ).
  @Prop({ type: String })
  storyContext?: string;

  @Prop({ type: String })
  illustrationUrl?: string;

  // Bài CAREER_ADULT DATA_SQL: mã dataset mẫu liên kết (vd sales_v1).
  @Prop({ type: String })
  datasetId?: string;

  // userId của người tạo (giảng viên chỉ được sửa/xóa bài của chính mình).
  @Prop({ type: String, index: true })
  authorId?: string;

  // Test ẩn và lời giải chính thức: select:false nên MỌI truy vấn mặc định đều
  // không thấy. Chỉ judge (+hiddenTestCases) và màn quản trị của staff mới
  // chủ động select thêm. Bài cũ vẫn để test ẩn trong testCases (isHidden).
  @Prop({ type: [ExerciseTestCaseSchema], default: [], select: false })
  hiddenTestCases: ExerciseTestCase[];

  @Prop({ type: String, select: false })
  officialSolution?: string;

  /**
   * Bài do giảng viên tạo cho NGÂN HÀNG ĐỀ (AI Tạo Đề, soạn thủ công): chỉ để gán vào Ngày học của lớp hoặc đề thi Cuộc thi.
   * Không hiện trong danh mục Code Playground của học viên (kho bài Playground là cố định).
   */
  @Prop({ type: Boolean, default: false })
  bankOnly?: boolean;

  /**
   * Khối của Ngân hàng đề ('6-9' | '10-12'). Trường BỔ SUNG, Code Playground không đọc: dùng để phân loại bài cũ mà không đổi
   * targetGroup/gradeBand (vốn quyết định học viên nào thấy bài trong Playground).
   */
  @Prop({ type: String, enum: ['6-9', '10-12'], index: true })
  bankBand?: '6-9' | '10-12';

  // Grade band this exercise targets ('3-5' | '6-9' | '9-12', ...). Lets the UI
  // filter the catalog by class level instead of showing every exercise flat.
  @Prop({ type: String })
  gradeBand?: string;

  // Name of the game/topic pack this exercise belongs to within its grade band
  // (e.g. 'python-fundamentals', 'robot-ve-nha'). A grade band can hold several
  // topics side by side, each with its own difficulty progression.
  @Prop({ type: String })
  topic?: string;

  // 1-based position within its topic, for ordering the progression on screen
  // independent of insertion order or slug naming.
  @Prop({ type: Number })
  orderInTopic?: number;

  @Prop({ type: LessonHintsSchema })
  hints?: LessonHints;

  // Slug của Lesson (Teacher Authoring) đã tạo/đồng bộ bản ghi exercise này,
  // set DUY NHẤT bởi AuthoringService.syncPublishedCodingLessonToExerciseBank.
  // Dùng để phân biệt "exercise thuộc sở hữu của lesson này, an toàn để
  // lesson tự cập nhật lại" với "exercise có cùng slug nhưng do nguồn khác
  // tạo (AI Tạo Đề lưu trực tiếp qua saveDraft, hoặc import thủ công)" —
  // undefined/không khớp lesson.slug nghĩa là KHÔNG được ghi đè âm thầm.
  @Prop({ type: String })
  sourceLessonSlug?: string;

  // Audit trail cho cơ chế human-in-the-loop khi lưu đè cảnh báo trùng lặp
  // MỀM (xem ProblemGeneratorService.saveDraft, forceSave). Chỉ set khi bài
  // được lưu qua forceSave=true trong khi vẫn còn duplicateCandidates chưa
  // xử lý — giúp người vận hành sau này lọc ra các bài "đã bị giáo viên bỏ
  // qua cảnh báo" để rà soát lại nếu cần, không xoá dấu vết như ghi đè âm
  // thầm thông thường.
  @Prop({ type: Boolean, default: false })
  hasDuplicateWarning?: boolean;

  @Prop({ type: String })
  approvedBy?: string;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: String })
  overrideReason?: string;

  // Mã dataset trong Dataset Registry của Data & AI Resource (TTS 01), vd
  // `ds-retail-ecommerce-sales-v1`. Bài lab DA không lưu cấu trúc bảng hay dữ
  // liệu: mọi thứ lấy qua DatasetIntegrationService theo mã này. Giữ tên
  // snake_case đúng như trong hợp đồng API giữa hai bên.
  @Prop({ type: String, index: true })
  resource_id?: string;

  @Prop({ type: String })
  resource_version?: string;

  // Version cố định được khóa tại thời điểm assignment (Day 26 - Immutable locked version)
  @Prop({ type: String })
  assignedResourceVersion?: string;

  @Prop({ type: [InsightRubricCriterionSchema], default: undefined })
  insightRubric?: InsightRubricCriterion[];

  // Đặc tả chấm bài AI_LAB (kỹ thuật prompt, model cho phép, ngân sách
  // cost/latency), xem modules-api/ai-labs/ai-lab.types.ts. `resource_id`
  // của bài AI_LAB là mã evaluation set của TTS 01.
  @Prop({ type: Object })
  aiLabSpec?: object;
}

export const ExerciseSchema = SchemaFactory.createForClass(Exercise);
