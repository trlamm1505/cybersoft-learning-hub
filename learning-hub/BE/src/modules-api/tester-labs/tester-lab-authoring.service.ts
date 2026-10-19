import { BadRequestException, Body, ConflictException, Controller, Injectable, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TesterLab, TesterLabDocument } from '../../modules-system/database/schemas/tester-lab.schema';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { slugify } from '../../common/utils/slug.util';

export class CreateTesterLabDto {
  labCode?: string;
  title?: string;
  description?: string;
  category?: string;
  environmentUrl?: string;
  rubricCriteria?: Array<{ key?: string; label?: string; maxScore?: number; kind?: string }>;
  requiredColumns?: string[];
}

const CATEGORIES = ['BUG_REPORT', 'TEST_CASE_DESIGN', 'API_TESTING'];
const KINDS = ['severity', 'quality'];
const LAB_CODE = /^[A-Z0-9][A-Z0-9-]{2,24}$/;

/**
 * Giảng viên tạo thêm bài Tester Lab mới (đề, rubric chấm). Lưu vào cùng collection với bộ lab có sẵn nên Hub Lab và
 * "Lớp học của tôi" tự nhận bài mới; học viên nộp bằng biểu mẫu hoặc file như các bài cũ.
 */
@Injectable()
export class TesterLabAuthoringService {
  constructor(@InjectModel(TesterLab.name) private readonly labs: Model<TesterLabDocument>) {}

  async createLab(dto: CreateTesterLabDto, _user: JwtPayload) {
    const labCode = (dto?.labCode ?? '').trim().toUpperCase();
    if (!LAB_CODE.test(labCode)) throw new BadRequestException('Mã lab gồm 3-25 ký tự chữ HOA, số hoặc dấu gạch ngang, ví dụ LAB-13.');
    const title = (dto.title ?? '').trim();
    const description = (dto.description ?? '').trim();
    if (!title || title.length > 200) throw new BadRequestException('Tiêu đề bắt buộc, tối đa 200 ký tự.');
    if (!description || description.length > 4000) throw new BadRequestException('Mô tả bắt buộc, tối đa 4000 ký tự.');
    const category = (dto.category ?? '').trim().toUpperCase();
    if (!CATEGORIES.includes(category)) throw new BadRequestException(`Loại lab chỉ nhận: ${CATEGORIES.join(', ')}.`);
    const env = (dto.environmentUrl ?? '').trim();
    if (env && !/^https?:\/\/\S+$/i.test(env)) throw new BadRequestException('environmentUrl phải là địa chỉ http(s).');

    const raw = Array.isArray(dto.rubricCriteria) ? dto.rubricCriteria : [];
    if (raw.length === 0 || raw.length > 10) throw new BadRequestException('Rubric cần từ 1 đến 10 tiêu chí chấm.');
    const seen = new Set<string>();
    const rubricCriteria = raw.map((c, i) => {
      const label = (c?.label ?? '').trim();
      const key = ((c?.key ?? '').trim() || slugify(label)).toLowerCase();
      const maxScore = c?.maxScore;
      if (!label || label.length > 150) throw new BadRequestException(`Tiêu chí #${i + 1}: thiếu tên (tối đa 150 ký tự).`);
      if (!key || seen.has(key)) throw new BadRequestException(`Tiêu chí "${label}": khóa trống hoặc bị trùng.`);
      if (typeof maxScore !== 'number' || !Number.isInteger(maxScore) || maxScore < 1 || maxScore > 100) {
        throw new BadRequestException(`Tiêu chí "${label}": điểm tối đa phải là số nguyên từ 1 đến 100.`);
      }
      const kind = c.kind ?? 'quality';
      if (!KINDS.includes(kind)) throw new BadRequestException(`Tiêu chí "${label}": kind chỉ nhận severity hoặc quality.`);
      seen.add(key);
      return { key, label, maxScore, kind: kind as 'severity' | 'quality' };
    });

    if (await this.labs.exists({ labCode })) throw new ConflictException(`Mã lab "${labCode}" đã tồn tại.`);
    const created = await this.labs.create({
      labCode,
      title,
      description,
      category: category as never,
      environmentUrl: env,
      rubricCriteria,
      requiredColumns: (dto.requiredColumns ?? []).filter((c) => typeof c === 'string' && c.trim()).slice(0, 20),
    });
    return { id: String(created._id), labCode, title, category, criteriaCount: rubricCriteria.length, maxScore: rubricCriteria.reduce((s, c) => s + c.maxScore, 0) };
  }
}

@Controller('teacher/tester-labs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class TesterLabAuthoringController {
  constructor(private readonly service: TesterLabAuthoringService) {}

  /** POST /api/teacher/tester-labs — tạo bài Tester Lab mới (giảng viên/quản trị viên). */
  @Post()
  create(@Body() dto: CreateTesterLabDto, @CurrentUser() user: JwtPayload) {
    return this.service.createLab(dto, user);
  }
}
