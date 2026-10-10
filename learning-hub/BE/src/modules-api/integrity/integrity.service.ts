import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  Submission,
  SubmissionDocument,
} from '../../modules-system/database/schemas/submission.schema';
import type { IntegrityDecision } from '../../modules-system/database/schemas/submission.schema';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import {
  User,
  UserDocument,
} from '../../modules-system/database/schemas/user.schema';
import { findBestMatch } from './code-similarity';
import {
  buildIntegritySignals,
  ClientIntegrityPayload,
} from './integrity-signals';
import { INTEGRITY_CONFIG } from './integrity.config';

export const INTEGRITY_DECISIONS: IntegrityDecision[] = [
  'CLEARED',
  'CONCERN',
  'FOLLOW_UP',
];

export interface IntegrityReviewInput {
  decision?: string;
  note?: string;
}

@Injectable()
export class IntegrityService {
  constructor(
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Tính tín hiệu cho một lần nộp MỚI (trước khi lưu). Không ném lỗi khi so
   * khớp thất bại: tín hiệu hỗ trợ không được làm hỏng việc nộp bài.
   */
  async evaluate(
    exercise: { _id: unknown; starterCode?: string },
    userId: string,
    code: string,
    payload: ClientIntegrityPayload | undefined,
  ) {
    let similarity: { score: number; submissionId?: string; userId?: string } =
      { score: 0 };
    try {
      const others = await this.submissionModel
        .find({ exerciseId: String(exercise._id), userId: { $ne: userId } })
        .select('userId code')
        .sort({ createdAt: -1 })
        .limit(INTEGRITY_CONFIG.maxComparisons)
        .lean();
      similarity = findBestMatch(
        code,
        exercise.starterCode ?? '',
        others.map((o: any) => ({
          id: String(o._id),
          userId: o.userId,
          code: o.code,
        })),
        userId,
      );
    } catch {
      // tín hiệu phụ: bỏ qua, bài vẫn được nộp bình thường
    }
    return buildIntegritySignals(payload, similarity);
  }

  /** Hàng chờ: bài có cờ chưa duyệt; `?status=REVIEWED|NORMAL` để xem nhóm khác. */
  async listQueue(status?: string, limit = 100) {
    const reviewStatus =
      status === 'REVIEWED' || status === 'NORMAL' ? status : 'NEEDS_REVIEW';
    const docs = await this.submissionModel
      .find({ 'integrity.reviewStatus': reviewStatus })
      .select('exerciseId userId status integrity createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return this.withNames(docs);
  }

  async getDetail(id: string) {
    const doc: any = await this.findOrThrow(id);
    const [row] = await this.withNames([doc]);
    let match: any = null;
    const matchedId = doc.integrity?.similarity?.matchedSubmissionId;
    if (matchedId && isValidObjectId(matchedId)) {
      const other: any = await this.submissionModel
        .findById(matchedId)
        .select('userId code')
        .lean();
      if (other) {
        const owners: any[] = await this.userModel
          .find({ _id: other.userId })
          .select('fullName email')
          .lean();
        const owner = owners[0];
        match = {
          submissionId: String(other._id),
          student: owner
            ? { id: other.userId, fullName: owner.fullName, email: owner.email }
            : { id: other.userId },
          code: other.code,
        };
      }
    }
    return { ...row, code: doc.code, match };
  }

  async review(id: string, input: IntegrityReviewInput, reviewerId: string) {
    const decision = input?.decision as IntegrityDecision;
    if (!INTEGRITY_DECISIONS.includes(decision)) {
      throw new BadRequestException(
        `Kết luận phải là một trong: ${INTEGRITY_DECISIONS.join(', ')}`,
      );
    }
    const note = (input?.note ?? '').trim();
    if (!note) {
      throw new BadRequestException('Cần nhập lý do/nhận xét khi duyệt');
    }
    const doc: any = await this.findOrThrow(id);
    if (!doc.integrity) {
      throw new NotFoundException('Bài nộp này không có tín hiệu liêm chính');
    }
    // Chỉ cập nhật trường duyệt; tuyệt đối không động tới status/điểm chấm.
    await this.submissionModel.updateOne(
      { _id: id },
      {
        $set: {
          'integrity.reviewStatus': 'REVIEWED',
          'integrity.decision': decision,
          'integrity.reviewNote': note.slice(0, 2000),
          'integrity.reviewedBy': reviewerId,
          'integrity.reviewedAt': new Date(),
        },
      },
    );
    return { id, reviewStatus: 'REVIEWED', decision, reviewedBy: reviewerId };
  }

  private async findOrThrow(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Không tìm thấy bài nộp "${id}"`);
    }
    const doc = await this.submissionModel.findById(id).lean();
    if (!doc) throw new NotFoundException(`Không tìm thấy bài nộp "${id}"`);
    return doc;
  }

  private async withNames(docs: any[]) {
    if (docs.length === 0) return [];
    const userIds = [...new Set(docs.map((d) => d.userId).filter(Boolean))];
    const exerciseIds = [...new Set(docs.map((d) => d.exerciseId))];
    const [users, exercises] = await Promise.all([
      this.userModel
        .find({ _id: { $in: userIds } })
        .select('fullName email')
        .lean(),
      this.exerciseModel
        .find({ _id: { $in: exerciseIds } })
        .select('title slug')
        .lean(),
    ]);
    const userById = new Map(users.map((u: any) => [String(u._id), u]));
    const exById = new Map(exercises.map((e: any) => [String(e._id), e]));
    return docs.map((d) => {
      const u: any = userById.get(d.userId);
      const e: any = exById.get(d.exerciseId);
      return {
        id: String(d._id),
        submittedAt: d.integrity?.timeline?.submittedAt ?? d.createdAt,
        judgeStatus: d.status,
        student: u
          ? { id: d.userId, fullName: u.fullName, email: u.email }
          : { id: d.userId },
        exercise: e
          ? { id: d.exerciseId, slug: e.slug, title: e.title }
          : { id: d.exerciseId },
        integrity: d.integrity,
      };
    });
  }
}
