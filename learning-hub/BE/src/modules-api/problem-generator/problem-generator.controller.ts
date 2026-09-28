import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { ProblemGeneratorService } from './problem-generator.service';
import { GenerateProblemDto } from './dto/generate-problem.dto';
import { SaveProblemDto } from './dto/save-problem.dto';

const VALID_LEVELS = ['EASY', 'MEDIUM', 'HARD'];
// Chạy tuần tự, mỗi request Gemini ~10-30s — giới hạn số bài/lần gọi để
// một request HTTP không treo quá lâu và không dễ bị lạm dụng quota.
const MAX_SPECS_PER_REQUEST = 10;

@Controller('problem-generator')
export class ProblemGeneratorController {
  constructor(private readonly problemGeneratorService: ProblemGeneratorService) {}

  /**
   * POST /api/problem-generator/generate
   * Sinh một hoặc nhiều bản nháp bài tập từ learning outcome/level/
   * constraints/tags do giáo viên nhập, rồi chạy validator (reference
   * solution qua test thật + kiểm tra trùng lặp) trước khi trả về. KHÔNG
   * ghi vào MongoDB — giáo viên tự đọc kết quả rồi mới quyết định lưu qua
   * route /save, giữ đúng điều kiện "không publish tự động".
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  async generate(@Body() dto: GenerateProblemDto) {
    if (!Array.isArray(dto.specs) || dto.specs.length === 0) {
      throw new BadRequestException('specs phải là mảng có ít nhất 1 phần tử.');
    }
    if (dto.specs.length > MAX_SPECS_PER_REQUEST) {
      throw new BadRequestException(
        `Tối đa ${MAX_SPECS_PER_REQUEST} bài trong một lần sinh.`,
      );
    }

    const inputs = dto.specs.map((spec, i) => {
      if (!spec.learningOutcome || !spec.learningOutcome.trim()) {
        throw new BadRequestException(`specs[${i}].learningOutcome không được để trống.`);
      }
      if (!spec.level || !VALID_LEVELS.includes(spec.level)) {
        throw new BadRequestException(`specs[${i}].level phải là EASY, MEDIUM hoặc HARD.`);
      }
      return {
        learningOutcome: spec.learningOutcome.trim(),
        level: spec.level,
        constraints: Array.isArray(spec.constraints) ? spec.constraints : [],
        tags: Array.isArray(spec.tags) ? spec.tags : [],
      };
    });

    const results = await this.problemGeneratorService.generateMany(inputs);
    return { results };
  }

  /**
   * POST /api/problem-generator/save
   * Lưu MỘT draft đã sinh (và đã được giáo viên xem qua) vào ngân hàng đề
   * thật (collection `exercises`). Đây là hành động do người bấm, KHÁC với
   * "publish tự động" mà đề bài ngày 19 cấm — validator được chạy lại ở
   * tầng service, không tin trạng thái pass/fail do client tự gửi lên.
   */
  @Post('save')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  async save(@Body() dto: SaveProblemDto) {
    if (!dto.draft) {
      throw new BadRequestException('draft không được để trống.');
    }
    return this.problemGeneratorService.saveDraft(dto.draft);
  }
}
