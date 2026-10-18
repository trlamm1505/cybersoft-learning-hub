import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import { Classroom, ClassroomDocument } from '../../modules-system/database/schemas/classroom.schema';
import { AuditLogService } from '../admin-portal/audit-log.service';
import { sanitizeFeedback } from '../../common/utils/sanitize-feedback.util';
import { TESTER_RUBRIC, validateTesterGrade } from '../assessment/domain/tester-rubric';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import * as path from 'path';
import {
  TesterLab,
  TesterLabDocument,
} from '../../modules-system/database/schemas/tester-lab.schema';
import {
  RubricGrade,
  TesterLabSubmission,
  TesterLabSubmissionDocument,
} from '../../modules-system/database/schemas/tester-lab-submission.schema';
import {
  ArtifactUploadService,
  UPLOAD_DIR,
  UploadedArtifact,
} from './artifact-upload.service';
import { INITIAL_TESTER_LABS } from '../../data/initial-tester-labs';
import { evaluateRubric, runAutoChecks } from './rubric-evaluation.engine';
import { runFormChecks, sanitizeTesterForm } from './tester-form-checks';

const ASSET_DIR = path.join(process.cwd(), 'assets', 'tester-labs');
const MAX_NOTES_LENGTH = 2000;

export interface TesterLabUser {
  sub: string;
  role: string;
}

/** Giảng viên chỉ được ghi: điểm (grades), nhận xét (reviewerNotes) và trạng thái; mọi trường khác trong body bị bỏ qua. */
export interface ReviewInput {
  grades: RubricGrade[];
  reviewerNotes?: string;
}

export const MIN_REASON_LENGTH = 10;

/** Lý do bắt buộc (>= 10 ký tự sau khi trim); thiếu thì 400 ngay. */
export function requireReason(reason: unknown): string {
  const text = typeof reason === 'string' ? sanitizeFeedback(reason, 500) : '';
  if (text.length < MIN_REASON_LENGTH) {
    throw new BadRequestException({ code: 'E400_REASON_REQUIRED', message: `Vui lòng nhập lý do (tối thiểu ${MIN_REASON_LENGTH} ký tự).` });
  }
  return text;
}

export const finalizedError = () =>
  new ForbiddenException({ code: 'E403_SCORE_FINALIZED', message: 'Điểm đã được chốt chính thức. Hãy gửi yêu cầu mở phúc khảo để chấm lại.' });

@Injectable()
export class TesterLabsService implements OnModuleInit {
  private readonly logger = new Logger(TesterLabsService.name);

  constructor(
    @InjectModel(TesterLab.name)
    private readonly labModel: Model<TesterLabDocument>,
    @InjectModel(TesterLabSubmission.name)
    private readonly submissionModel: Model<TesterLabSubmissionDocument>,
    private readonly uploadService: ArtifactUploadService,
    // Tùy chọn để các test cũ dựng service không cần hai phụ thuộc này.
    @Optional() @InjectModel(Classroom.name)
    private readonly classModel?: Model<ClassroomDocument>,
    @Optional() private readonly audit?: AuditLogService,
    @Optional() @InjectModel(User.name)
    private readonly userModel?: Model<UserDocument>,
  ) {}

  /**
   * Nạp lab mặc định theo labCode (idempotent): chỉ chèn lab còn thiếu,
   * không bao giờ ghi đè lab đã có nên không ảnh hưởng bài nộp tham chiếu labId.
   */
  async onModuleInit() {
    await this.labModel.bulkWrite(
      INITIAL_TESTER_LABS.map((lab) => ({
        updateOne: {
          filter: { labCode: lab.labCode },
          update: { $setOnInsert: lab },
          upsert: true,
        },
      })),
    );
    this.logger.log(`Đã đồng bộ ${INITIAL_TESTER_LABS.length} Tester Lab mặc định`);
  }

  listLabs() {
    return this.labModel.find().sort({ labCode: 1 }).lean();
  }

  async getLab(labCode: string) {
    const lab = await this.labModel.findOne({ labCode }).lean();
    if (!lab) throw new NotFoundException(`Không tìm thấy lab ${labCode}`);
    return lab;
  }

  /** Chỉ cho tải đúng template/fixture khai báo trong lab — chặn path traversal. */
  async getAssetPath(labCode: string, name: string): Promise<string> {
    const lab = await this.getLab(labCode);
    if (name === lab.templateArtifact) {
      return path.join(ASSET_DIR, 'templates', name);
    }
    if (lab.fixtureUrls.includes(name)) {
      return path.join(ASSET_DIR, 'fixtures', name);
    }
    throw new NotFoundException('Không tìm thấy tài liệu');
  }

  async submit(labCode: string, userId: string, file?: UploadedArtifact) {
    const lab = await this.getLab(labCode);
    const stored = await this.uploadService.store(file);
    return this.submissionModel.create({
      labId: lab._id,
      userId,
      ...stored,
      autoCheckResults: runAutoChecks(
        lab,
        stored.fileType,
        (file as UploadedArtifact).buffer,
      ),
    });
  }

  /**
   * Nộp bằng biểu mẫu: danh sách test case (mã, mô tả, input, expected) và bug report. Lưu với trạng thái SUBMITTED
   * (chờ giảng viên chấm) và trả ngay nhận xét sơ bộ theo từ khóa tình huống biên.
   */
  async submitForm(labCode: string, userId: string, raw: unknown) {
    const lab = await this.getLab(labCode);
    const form = sanitizeTesterForm(raw);
    const autoCheckResults = runFormChecks(form);
    const submission = await this.submissionModel.create({
      labId: lab._id,
      userId,
      kind: 'FORM',
      artifactUrl: 'form',
      fileType: 'form',
      fileSize: JSON.stringify(form).length,
      formData: form,
      autoCheckResults,
      status: 'SUBMITTED',
    });
    return {
      id: String(submission._id),
      status: submission.status,
      statusLabel: 'Đã nộp bài - Chờ giảng viên chấm',
      autoCheckResults,
      testCaseCount: form.testCases.length,
      bugReportCount: form.bugReports.length,
    };
  }

  async listMine(labCode: string, userId: string) {
    const lab = await this.getLab(labCode);
    return this.submissionModel
      .find({ labId: lab._id, userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  /** Quyền của người gọi trên màn Tester Lab: FE hỏi trước để không gọi các API đọc/chấm mà vai trò này bị 403. */
  capabilities(user: TesterLabUser) {
    return { role: user.role, canReview: this.canReview(user.role), peerReview: user.role === 'STUDENT' && this.canReview('STUDENT') };
  }

  /**
   * Có xem được hàng chờ chấm Tester QA không: Admin luôn được; giảng viên chỉ khi đang phụ trách một lớp Tester QA (cùng luật với
   * assertTeacherScope). FE hỏi cờ này (luôn 200) trước khi tải hàng chờ, thay vì gọi rồi nhận 403 đỏ trong console.
   */
  async canSeeReviewQueue(user: TesterLabUser): Promise<boolean> {
    if (user.role === 'ADMIN') return true;
    if (user.role !== 'TEACHER') return false;
    if (!this.classModel) return true;
    return !!(await this.classModel.exists({ courseKey: 'tester-qa', archived: { $ne: true }, $or: [{ teacherId: user.sub }, { teacherIds: user.sub }] }));
  }

  /** Chỉ TEACHER/ADMIN chấm chính thức; STUDENT chỉ khi bật cờ peer-review. */
  private canReview(role: string): boolean {
    if (role === 'TEACHER' || role === 'ADMIN') return true;
    return role === 'STUDENT' && process.env.TESTER_LAB_PEER_REVIEW === 'true';
  }

  private assertCanReview(user: TesterLabUser) {
    if (!this.canReview(user.role)) {
      throw new ForbiddenException('Bạn không có quyền chấm bài');
    }
  }

  /**
   * Bài của người khác cần chấm. Peer-review (học viên) không thấy người nộp
   * lẫn tên file lưu trên server.
   */
  async listReviewable(labCode: string, user: TesterLabUser) {
    this.assertCanReview(user);
    const lab = await this.getLab(labCode);
    const query = this.submissionModel
      .find({ labId: lab._id, userId: { $ne: user.sub } })
      .sort({ createdAt: -1 });
    if (user.role === 'STUDENT') {
      query.select('-userId -artifactUrl -reviewerId');
    }
    return query.lean();
  }

  /** Giảng viên (không phải Admin) phải đang phụ trách một lớp khóa Tester QA mới được chấm/chốt bài tester. */
  private async assertTeacherScope(user: TesterLabUser) {
    if (user.role !== 'TEACHER' || !this.classModel) return;
    const owned = await this.classModel.exists({ courseKey: 'tester-qa', archived: { $ne: true }, $or: [{ teacherId: user.sub }, { teacherIds: user.sub }] });
    if (!owned) {
      throw new ForbiddenException({ code: 'E403_CLASS_NOT_OWNED', message: 'Bạn không phụ trách lớp nào có bài nộp này.' });
    }
  }

  /**
   * Hàng chờ chấm Tester QA: bài nộp đang ở trạng thái Chờ chấm của mọi lab, kèm tên học viên, rubric và nội dung biểu mẫu
   * (test case + bug report). Chỉ giảng viên đang phụ trách lớp Tester QA (hoặc Admin) xem được.
   */
  async reviewQueue(user: TesterLabUser) {
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') throw new ForbiddenException('Bạn không có quyền chấm bài');
    await this.assertTeacherScope(user);
    const subs = await this.submissionModel.find({ status: 'SUBMITTED', invalidated: { $ne: true } }).sort({ createdAt: 1 }).limit(200).lean();
    if (subs.length === 0) return [];
    const labs = await this.labModel.find({ _id: { $in: [...new Set(subs.map((s) => String(s.labId)))] } }).select('labCode title rubricCriteria').lean();
    const labById = new Map(labs.map((l: any) => [String(l._id), l]));
    const ids = [...new Set(subs.map((s) => s.userId))].filter(isValidObjectId);
    const people = this.userModel ? await this.userModel.find({ _id: { $in: ids } }).select('fullName email').lean() : [];
    const byId = new Map((people as any[]).map((u) => [String(u._id), u]));
    return subs.map((s: any) => {
      const lab: any = labById.get(String(s.labId));
      const u: any = byId.get(s.userId);
      return {
        id: String(s._id),
        status: s.status,
        submittedAt: s.createdAt,
        kind: s.kind,
        lab: { labCode: lab?.labCode ?? '', title: lab?.title ?? '', rubricCriteria: TESTER_RUBRIC },
        student: { id: s.userId, fullName: u?.fullName ?? '', email: u?.email ?? '' },
        formData: s.formData ?? null,
        autoCheckResults: s.autoCheckResults ?? [],
      };
    });
  }

  async review(id: string, user: TesterLabUser, input: ReviewInput) {
    this.assertCanReview(user);
    await this.assertTeacherScope(user);
    const submission = await this.findSubmission(id);
    if (submission.userId === user.sub) {
      throw new ForbiddenException('Không được tự chấm bài của chính mình');
    }
    if (submission.isFinalized) throw finalizedError();
    const lab = await this.labModel.findById(submission.labId).lean();
    if (!lab) throw new NotFoundException('Lab của bài nộp không còn tồn tại');
    // Rubric chuẩn 3 tiêu chí (40/30/30): bắt buộc đủ điểm từng tiêu chí và nhận xét >= 20 ký tự (tính sau khi làm sạch HTML).
    const notes = sanitizeFeedback(input?.reviewerNotes ?? '', MAX_NOTES_LENGTH);
    const checked = validateTesterGrade({ grades: input?.grades, reviewerNotes: notes });

    const summary = evaluateRubric(TESTER_RUBRIC, checked.grades);
    submission.rubricGrades = summary.grades;
    submission.reviewerNotes = checked.notes;
    submission.reviewerId = user.sub;
    submission.status = 'REVIEWED';
    await submission.save();
    return { submission, summary };
  }

  /** Chốt điểm chính thức: từ đây giảng viên không sửa được nữa. */
  async finalize(id: string, user: TesterLabUser & { email?: string }) {
    this.assertCanReview(user);
    if (user.role === 'STUDENT') throw new ForbiddenException('Chỉ giảng viên được chốt điểm.');
    await this.assertTeacherScope(user);
    const submission = await this.findSubmission(id);
    if (submission.status !== 'REVIEWED') throw new BadRequestException('Chỉ chốt được bài đã chấm.');
    if (submission.isFinalized) return { submission };
    submission.isFinalized = true;
    submission.finalizedAt = new Date();
    await submission.save();
    await this.audit?.record({ sub: user.sub, email: user.email ?? '' }, 'SUBMISSION_FINALIZE', 'SUBMISSION', id, { isFinalized: false }, { isFinalized: true });
    return { submission };
  }

  /** Yêu cầu mở phúc khảo cho bài đã chốt (cần lý do); Admin duyệt ở reopen(). */
  async requestReopen(id: string, user: TesterLabUser & { email?: string }, reason: unknown) {
    if (user.role === 'STUDENT') throw new ForbiddenException('Chỉ giảng viên được yêu cầu phúc khảo.');
    await this.assertTeacherScope(user);
    const text = requireReason(reason);
    const submission = await this.findSubmission(id);
    if (!submission.isFinalized) throw new BadRequestException('Bài chưa chốt điểm nên có thể chấm lại trực tiếp.');
    submission.reopenRequest = { requestedBy: user.sub, reason: text, at: new Date() };
    await submission.save();
    await this.audit?.record({ sub: user.sub, email: user.email ?? '' }, 'SUBMISSION_REVIEW_REQUEST', 'SUBMISSION', id, null, { reopenRequest: true }, text);
    return { submission };
  }

  /** Admin duyệt phúc khảo: mở khóa điểm để giảng viên chấm lại. Chỉ khi có yêu cầu đang chờ. */
  async reopen(id: string, user: TesterLabUser & { email?: string }) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Chỉ quản trị viên được duyệt phúc khảo.');
    const submission = await this.findSubmission(id);
    if (!submission.isFinalized || !submission.reopenRequest) throw new BadRequestException('Không có yêu cầu phúc khảo đang chờ.');
    submission.isFinalized = false;
    submission.reopenRequest = undefined;
    await submission.save();
    await this.audit?.record({ sub: user.sub, email: user.email ?? '' }, 'SUBMISSION_FINALIZE', 'SUBMISSION', id, { isFinalized: true }, { isFinalized: false }, 'Admin duyệt phúc khảo');
    return { submission };
  }

  /** Chủ bài nộp hoặc người có quyền chấm mới được tải file artifact. */
  async getArtifactPath(id: string, user: TesterLabUser): Promise<string> {
    const submission = await this.findSubmission(id);
    if (submission.userId !== user.sub) this.assertCanReview(user);
    if (submission.kind === 'FORM') throw new NotFoundException('Bài nộp dạng biểu mẫu không có file đính kèm');
    return path.join(UPLOAD_DIR, path.basename(submission.artifactUrl));
  }

  private async findSubmission(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('Bài nộp không tồn tại');
    const submission = await this.submissionModel.findById(id);
    if (!submission) throw new NotFoundException('Bài nộp không tồn tại');
    return submission;
  }
}
