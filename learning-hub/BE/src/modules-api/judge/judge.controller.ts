import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Submission, SubmissionDocument } from '../../modules-system/database/schemas/submission.schema';

@Controller('exercises/submissions')
export class JudgeController {
  constructor(
    @InjectModel(Submission.name) private readonly submissionModel: Model<SubmissionDocument>,
  ) {}

  /**
   * GET /api/exercises/submissions/:id — polled by the frontend until a terminal status.
   * Hidden test input/expectedOutput/actualOutput are never persisted for hidden test cases
   * in the first place (stripped at write time in JudgeQueueService), so a plain lean() read
   * back cannot leak them.
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Không tìm thấy bài nộp "${id}"`);
    }

    const submission = await this.submissionModel
      .findById(id)
      .select('exerciseId code status passedCount totalCount results errorMessage memoryUsedMb createdAt updatedAt')
      .lean();

    if (!submission) throw new NotFoundException(`Không tìm thấy bài nộp "${id}"`);
    return submission;
  }
}
