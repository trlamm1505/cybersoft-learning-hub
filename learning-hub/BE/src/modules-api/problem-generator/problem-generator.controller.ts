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
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import {
  MAX_FREEFORM_TEXT_LENGTH,
  sanitizeFreeformText,
  sanitizeFreeformTextArray,
} from '../../common/utils/sanitize-text-input.util';
import { ProblemGeneratorService } from './problem-generator.service';
import { GenerateProblemDto } from './dto/generate-problem.dto';
import { SaveProblemDto } from './dto/save-problem.dto';
import { RevalidateProblemDto } from './dto/revalidate-problem.dto';

const VALID_LEVELS = ['EASY', 'MEDIUM', 'HARD'];
// Chạy tuần tự, mỗi request Gemini ~10-30s — giới hạn số bài/lần gọi để
// một request HTTP không treo quá lâu và không dễ bị lạm dụng quota.
const MAX_SPECS_PER_REQUEST = 10;
// constraints là đoạn văn dài hơn learningOutcome (có thể liệt kê nhiều ràng
// buộc một dòng) — cho phép dài hơn tag nhưng vẫn giới hạn để không phình
// prompt gửi lên Gemini.
const MAX_CONSTRAINT_LENGTH = 300;

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
   *
   * PARTIAL SUCCESS: trả về { results, errors } — một spec lỗi không làm
   * mất các bài đã sinh thành công trong cùng lô (xem
   * ProblemGeneratorService.generateMany). errors[].reason đã được
   * sanitize, không rò rỉ stack trace/internal error 500 ra client.
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async generate(@Body() dto: GenerateProblemDto) {
    if (!Array.isArray(dto.specs) || dto.specs.length === 0) {
      throw new BadRequestException('specs phải là mảng có ít nhất 1 phần tử.');
    }
    if (dto.specs.length > MAX_SPECS_PER_REQUEST) {
      throw new BadRequestException(
        `Tối đa ${MAX_SPECS_PER_REQUEST} bài trong một lần sinh.`,
      );
    }

    // Sanitize TRƯỚC khi đưa vào prompt Gemini: cắt ký tự điều khiển ẩn,
    // giới hạn độ dài từng field và số lượng phần tử mảng — learningOutcome/
    // constraints/tags đều do giáo viên gõ tự do, một chuỗi quá dài hoặc
    // chứa ký tự ẩn có thể dùng để "nhồi" prompt injection vào request gửi
    // lên Gemini.
    const inputs = dto.specs.map((spec, i) => {
      const learningOutcome = sanitizeFreeformText(
        spec.learningOutcome,
        MAX_FREEFORM_TEXT_LENGTH,
      );
      if (!learningOutcome) {
        throw new BadRequestException(`specs[${i}].learningOutcome không được để trống.`);
      }
      if (!spec.level || !VALID_LEVELS.includes(spec.level)) {
        throw new BadRequestException(`specs[${i}].level phải là EASY, MEDIUM hoặc HARD.`);
      }
      return {
        learningOutcome,
        level: spec.level,
        constraints: sanitizeFreeformTextArray(spec.constraints, {
          maxItemLength: MAX_CONSTRAINT_LENGTH,
        }),
        tags: sanitizeFreeformTextArray(spec.tags),
      };
    });

    return this.problemGeneratorService.generateMany(inputs);
  }

  /**
   * POST /api/problem-generator/save
   * Lưu MỘT draft đã sinh (và đã được giáo viên xem qua) vào ngân hàng đề
   * thật (collection `exercises`). Đây là hành động do người bấm, KHÁC với
   * "publish tự động" mà đề bài ngày 19 cấm — validator được chạy lại ở
   * tầng service, không tin trạng thái pass/fail do client tự gửi lên.
   *
   * forceSave: cơ chế human-in-the-loop cho cảnh báo trùng lặp MỀM — giáo
   * viên tick xác nhận đã đối chiếu và muốn lưu đè. approvedBy LUÔN lấy từ
   * JWT (không tin client tự khai), để audit trail (Exercise.approvedBy)
   * phản ánh đúng người thật đã duyệt.
   */
  @Post('save')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async save(@CurrentUser() user: JwtPayload, @Body() dto: SaveProblemDto) {
    if (!dto.draft) {
      throw new BadRequestException('draft không được để trống.');
    }
    return this.problemGeneratorService.saveDraft(dto.draft, {
      forceSave: dto.forceSave === true,
      overrideReason: dto.overrideReason,
      approvedBy: user.sub,
    });
  }

  /**
   * POST /api/problem-generator/revalidate
   * "Chạy lại test" cho một draft mà giáo viên vừa tự sửa trực tiếp trên UI
   * (title/description/solutionCode/testCases) — KHÔNG gọi lại Gemini, chỉ
   * chạy lại syntax check + test thật + duplicate check, trả kết quả ngay để
   * giáo viên biết bản đã sửa có pass không trước khi bấm Lưu.
   */
  @Post('revalidate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async revalidate(@Body() dto: RevalidateProblemDto) {
    if (!dto.draft) {
      throw new BadRequestException('draft không được để trống.');
    }
    return this.problemGeneratorService.revalidateDraft(dto.draft);
  }
}
