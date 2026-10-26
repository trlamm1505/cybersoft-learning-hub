import { BadRequestException, ConflictException, Controller, Body, Injectable, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise, ExerciseDocument } from '../../modules-system/database/schemas/exercise.schema';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { slugify } from '../../common/utils/slug.util';
import { SALES_RESOURCE_ID } from '../../data/initial-da-labs';
import { DA_LAB_TOPIC } from './da-labs.service';
import { SqlGraderService } from './sql-grader.service';

export class CreateSqlLabDto {
  title?: string;
  description?: string;
  difficulty?: string;
  points?: number;
  starterCode?: string;
  /** Câu SQL tham chiếu (đáp án mẫu); được chạy thử ngay khi tạo để chắc chắn bài chấm được. */
  solutionCode?: string;
  slug?: string;
}

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

/**
 * Giảng viên tạo thêm bài SQL Lab mới. Bài lưu vào CSDL cùng chỗ với bộ bài có sẵn (topic da-lab-pack) nên danh sách ở Hub Lab và
 * trang "Lớp học của tôi" tự nhận bài mới, không cần sửa mã giao diện.
 */
@Injectable()
export class DaLabAuthoringService {
  constructor(
    @InjectModel(Exercise.name) private readonly exercises: Model<ExerciseDocument>,
    private readonly sqlGrader: SqlGraderService,
  ) {}

  async createSqlLab(dto: CreateSqlLabDto, user: JwtPayload) {
    const title = (dto?.title ?? '').trim();
    const description = (dto?.description ?? '').trim();
    const solutionCode = (dto?.solutionCode ?? '').trim();
    if (!title || title.length > 200) throw new BadRequestException('Tiêu đề bắt buộc, tối đa 200 ký tự.');
    if (!description || description.length > 4000) throw new BadRequestException('Đề bài bắt buộc, tối đa 4000 ký tự.');
    if (!solutionCode) throw new BadRequestException('Thiếu câu SQL đáp án mẫu (solutionCode).');
    const difficulty = (dto.difficulty ?? 'MEDIUM').toUpperCase();
    if (!DIFFICULTIES.includes(difficulty)) throw new BadRequestException('Độ khó chỉ nhận EASY, MEDIUM hoặc HARD.');
    const points = dto.points === undefined ? 10 : dto.points;
    if (!Number.isInteger(points) || points < 1 || points > 100) throw new BadRequestException('Điểm phải là số nguyên từ 1 đến 100.');

    // Đáp án mẫu phải qua rào chắn chỉ-đọc và chạy được trên bộ dữ liệu, nếu không bài sẽ không chấm được.
    const run = await this.sqlGrader.run(SALES_RESOURCE_ID, solutionCode);
    if (run.status !== 'OK') {
      throw new BadRequestException(`Đáp án mẫu không chạy được: ${run.error ?? run.status}`);
    }
    if (!run.result || run.result.rowCount === 0) {
      throw new BadRequestException('Đáp án mẫu chạy được nhưng không trả dòng nào; hãy chọn truy vấn có kết quả để chấm.');
    }

    const slug = (dto.slug?.trim() || `da-sql-${slugify(title)}`).toLowerCase();
    if (!slug || !/^[a-z0-9][a-z0-9-]{2,80}$/.test(slug)) throw new BadRequestException('Slug không hợp lệ (chữ thường, số và dấu gạch ngang).');
    if (await this.exercises.exists({ slug })) throw new ConflictException(`Slug "${slug}" đã tồn tại.`);

    const last = await this.exercises
      .findOne({ topic: DA_LAB_TOPIC })
      .sort({ orderInTopic: -1 })
      .select('orderInTopic')
      .lean();
    const created = await this.exercises.create({
      slug,
      title,
      description,
      type: 'SQL_LAB',
      difficulty,
      points,
      starterCode: dto.starterCode?.trim() || 'SELECT\n',
      solutionCode,
      topic: DA_LAB_TOPIC,
      resource_id: SALES_RESOURCE_ID,
      tags: ['da-lab', 'sql'],
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      orderInTopic: ((last as { orderInTopic?: number } | null)?.orderInTopic ?? 0) + 1,
      authorId: user.sub,
    } as never);
    return { id: String(created._id), slug, title, type: 'SQL_LAB', difficulty, points, orderInTopic: created.orderInTopic };
  }
}

@Controller('teacher/da-labs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class DaLabAuthoringController {
  constructor(private readonly service: DaLabAuthoringService) {}

  /** POST /api/teacher/da-labs — tạo bài SQL Lab mới (giảng viên/quản trị viên). */
  @Post()
  create(@Body() dto: CreateSqlLabDto, @CurrentUser() user: JwtPayload) {
    return this.service.createSqlLab(dto, user);
  }
}
