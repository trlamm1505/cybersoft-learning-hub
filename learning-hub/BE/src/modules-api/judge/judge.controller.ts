import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  Submission,
  SubmissionDocument,
} from '../../modules-system/database/schemas/submission.schema';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

@Controller('exercises/submissions')
export class JudgeController {
  constructor(
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
  ) {}

  /**
   * GET /api/exercises/submissions/:id — polled by the frontend until a terminal status.
   * Bắt buộc đăng nhập và chỉ chủ sở hữu bài nộp (hoặc TEACHER) mới được xem, tránh
   * đoán ID để đọc trộm kết quả/code của học viên khác.
   * Hidden test input/expectedOutput/actualOutput are never persisted for hidden test cases
   * in the first place (stripped at write time in JudgeQueueService), so a plain lean() read
   * back cannot leak them.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Không tìm thấy bài nộp "${id}"`);
    }

    const submission = await this.submissionModel
      .findById(id)
      .select(
        'exerciseId userId code status passedCount totalCount results errorMessage memoryUsedMb createdAt updatedAt',
      )
      .lean();

    if (!submission)
      throw new NotFoundException(`Không tìm thấy bài nộp "${id}"`);

    if (submission.userId !== user.sub && user.role !== 'TEACHER') {
      throw new ForbiddenException('Bạn không có quyền xem bài nộp này');
    }

    return submission;
  }
}
