import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
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

const ASSET_DIR = path.join(process.cwd(), 'assets', 'tester-labs');
const MAX_NOTES_LENGTH = 2000;

export interface TesterLabUser {
  sub: string;
  role: string;
}

export interface ReviewInput {
  grades: RubricGrade[];
  reviewerNotes?: string;
}

@Injectable()
export class TesterLabsService implements OnModuleInit {
  private readonly logger = new Logger(TesterLabsService.name);

  constructor(
    @InjectModel(TesterLab.name)
    private readonly labModel: Model<TesterLabDocument>,
    @InjectModel(TesterLabSubmission.name)
    private readonly submissionModel: Model<TesterLabSubmissionDocument>,
    private readonly uploadService: ArtifactUploadService,
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

  async listMine(labCode: string, userId: string) {
    const lab = await this.getLab(labCode);
    return this.submissionModel
      .find({ labId: lab._id, userId })
      .sort({ createdAt: -1 })
      .lean();
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

  async review(id: string, user: TesterLabUser, input: ReviewInput) {
    this.assertCanReview(user);
    const submission = await this.findSubmission(id);
    if (submission.userId === user.sub) {
      throw new ForbiddenException('Không được tự chấm bài của chính mình');
    }
    const lab = await this.labModel.findById(submission.labId).lean();
    if (!lab) throw new NotFoundException('Lab của bài nộp không còn tồn tại');
    if (!Array.isArray(input?.grades)) {
      throw new BadRequestException('grades phải là mảng');
    }

    const summary = evaluateRubric(lab.rubricCriteria, input.grades);
    submission.rubricGrades = summary.grades;
    submission.reviewerNotes = String(input.reviewerNotes ?? '')
      .trim()
      .slice(0, MAX_NOTES_LENGTH);
    submission.reviewerId = user.sub;
    submission.status = 'REVIEWED';
    await submission.save();
    return { submission, summary };
  }

  /** Chủ bài nộp hoặc người có quyền chấm mới được tải file artifact. */
  async getArtifactPath(id: string, user: TesterLabUser): Promise<string> {
    const submission = await this.findSubmission(id);
    if (submission.userId !== user.sub) this.assertCanReview(user);
    return path.join(UPLOAD_DIR, path.basename(submission.artifactUrl));
  }

  private async findSubmission(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('Bài nộp không tồn tại');
    const submission = await this.submissionModel.findById(id);
    if (!submission) throw new NotFoundException('Bài nộp không tồn tại');
    return submission;
  }
}
