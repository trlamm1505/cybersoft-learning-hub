import { BadRequestException, Body, ConflictException, Controller, Injectable, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise, ExerciseDocument } from '../../modules-system/database/schemas/exercise.schema';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { slugify } from '../../common/utils/slug.util';
import { DatasetIntegrationService } from '../../integration/dataset-integration.service';
import { AI_LAB_TOPIC } from './ai-labs.service';
import type { AiLabSpec, PromptTechnique } from './ai-lab.catalog';

export class CreateAiLabDto {
  title?: string;
  description?: string;
  difficulty?: string;
  points?: number;
  /** Mã evaluation set (bộ câu hỏi + đáp án chuẩn) dùng để chấm. */
  resource_id?: string;
  starterCode?: string;
  rag?: boolean;
  techniques?: Array<{ label?: string; hint?: string; pattern?: string; weight?: number }>;
  passQuality?: number;
  budget?: { maxCostUsd?: number; maxLatencyMs?: number };
  slug?: string;
}

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const MAX_TECHNIQUES = 8;
const MAX_PATTERN_LENGTH = 200;
/** Cụm lặp lồng nhau kiểu (a+)+ dễ gây treo regex (ReDoS): từ chối. */
const NESTED_QUANTIFIER = /(\+|\*|\})\s*\)\s*(\+|\*|\{)/;

/** Kiểm tra một mẫu regex chấm kỹ thuật prompt: biên dịch được (cờ iu), ngắn, không có lặp lồng nhau. */
export function validatePattern(pattern: string): string | null {
  if (!pattern || pattern.length > MAX_PATTERN_LENGTH) return `Mẫu nhận diện bắt buộc và tối đa ${MAX_PATTERN_LENGTH} ký tự.`;
  if (NESTED_QUANTIFIER.test(pattern)) return 'Mẫu nhận diện có lặp lồng nhau, dễ làm treo hệ thống.';
  try {
    new RegExp(pattern, 'iu');
  } catch {
    return 'Mẫu nhận diện không phải biểu thức chính quy hợp lệ.';
  }
  return null;
}

/**
 * Giảng viên tạo thêm bài AI Lab (Prompting) mới. Lưu cùng chỗ với bộ bài có sẵn (topic ai-lab-pack) nên Hub Lab và
 * "Lớp học của tôi" tự nhận bài mới.
 */
@Injectable()
export class AiLabAuthoringService {
  constructor(
    @InjectModel(Exercise.name) private readonly exercises: Model<ExerciseDocument>,
    private readonly datasets: DatasetIntegrationService,
  ) {}

  async createAiLab(dto: CreateAiLabDto, user: JwtPayload) {
    const title = (dto?.title ?? '').trim();
    const description = (dto?.description ?? '').trim();
    if (!title || title.length > 200) throw new BadRequestException('Tiêu đề bắt buộc, tối đa 200 ký tự.');
    if (!description || description.length > 4000) throw new BadRequestException('Đề bài bắt buộc, tối đa 4000 ký tự.');
    const difficulty = (dto.difficulty ?? 'MEDIUM').toUpperCase();
    if (!DIFFICULTIES.includes(difficulty)) throw new BadRequestException('Độ khó chỉ nhận EASY, MEDIUM hoặc HARD.');
    const points = dto.points === undefined ? 10 : dto.points;
    if (!Number.isInteger(points) || points < 1 || points > 100) throw new BadRequestException('Điểm phải là số nguyên từ 1 đến 100.');
    const passQuality = dto.passQuality === undefined ? 50 : dto.passQuality;
    if (typeof passQuality !== 'number' || passQuality < 0 || passQuality > 100) throw new BadRequestException('passQuality phải từ 0 đến 100.');
    const maxCostUsd = dto.budget?.maxCostUsd ?? 0.01;
    const maxLatencyMs = dto.budget?.maxLatencyMs ?? 3000;
    if (!(maxCostUsd > 0) || maxCostUsd > 10 || !(maxLatencyMs > 0) || maxLatencyMs > 60_000) throw new BadRequestException('Ngân sách chi phí/độ trễ không hợp lệ.');

    const raw = Array.isArray(dto.techniques) ? dto.techniques : [];
    if (raw.length === 0 || raw.length > MAX_TECHNIQUES) throw new BadRequestException(`Cần từ 1 đến ${MAX_TECHNIQUES} kỹ thuật prompt để chấm.`);
    const techniques: PromptTechnique[] = raw.map((t, i) => {
      const label = (t?.label ?? '').trim();
      if (!label || label.length > 100) throw new BadRequestException(`Kỹ thuật #${i + 1}: thiếu tên (tối đa 100 ký tự).`);
      const problem = validatePattern((t?.pattern ?? '').trim());
      if (problem) throw new BadRequestException(`Kỹ thuật "${label}": ${problem}`);
      const weight = t.weight === undefined ? 1 : t.weight;
      if (typeof weight !== 'number' || weight <= 0 || weight > 10) throw new BadRequestException(`Kỹ thuật "${label}": trọng số phải từ 0 đến 10.`);
      return { id: slugify(label) || `t${i + 1}`, label, hint: (t?.hint ?? '').trim().slice(0, 300), pattern: (t.pattern ?? '').trim(), weight };
    });

    const resourceId = (dto.resource_id ?? '').trim();
    if (!resourceId) throw new BadRequestException('Thiếu resource_id (mã evaluation set dùng để chấm).');
    // Evaluation set phải tồn tại thật (404 nếu không): bài không có bộ câu hỏi thì không chấm được.
    await this.datasets.fetchEvaluationSet(resourceId);

    const slug = (dto.slug?.trim() || `ai-lab-${slugify(title)}`).toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{2,80}$/.test(slug)) throw new BadRequestException('Slug không hợp lệ (chữ thường, số và dấu gạch ngang).');
    if (await this.exercises.exists({ slug })) throw new ConflictException(`Slug "${slug}" đã tồn tại.`);

    const spec: AiLabSpec = { rag: dto.rag === true, techniques, passQuality, budget: { maxCostUsd, maxLatencyMs } };
    const last = await this.exercises.findOne({ topic: AI_LAB_TOPIC }).sort({ orderInTopic: -1 }).select('orderInTopic').lean();
    const created = await this.exercises.create({
      slug,
      title,
      description,
      type: 'AI_LAB',
      difficulty,
      points,
      starterCode: dto.starterCode?.trim() || 'Hãy xử lý câu hỏi sau.',
      resource_id: resourceId,
      aiLabSpec: spec,
      topic: AI_LAB_TOPIC,
      tags: ['ai-lab'],
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      orderInTopic: ((last as { orderInTopic?: number } | null)?.orderInTopic ?? 0) + 1,
      authorId: user.sub,
    } as never);
    return { id: String(created._id), slug, title, type: 'AI_LAB', difficulty, points, orderInTopic: created.orderInTopic };
  }
}

@Controller('teacher/ai-labs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class AiLabAuthoringController {
  constructor(private readonly service: AiLabAuthoringService) {}

  /** POST /api/teacher/ai-labs — tạo bài AI Lab mới (giảng viên/quản trị viên). */
  @Post()
  create(@Body() dto: CreateAiLabDto, @CurrentUser() user: JwtPayload) {
    return this.service.createAiLab(dto, user);
  }
}
