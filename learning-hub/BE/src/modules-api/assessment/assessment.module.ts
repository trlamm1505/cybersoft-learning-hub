import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import {
  Assessment,
  AssessmentSchema,
  AssessmentSubmission,
  AssessmentSubmissionSchema,
} from '../../modules-system/database/schemas/assessment.schemas';
import { AssessmentService } from './assessment.service';
import { KidProgressService } from './kid-progress.service';
import { CareerLabClassService } from './career-lab-class.service';
import { CareerLabClassController, StudentAssessmentController, TeacherAssessmentController } from './assessment.controller';

/** Tầng nghiệp vụ đánh giá: Assignment / Contest / Exam, vòng đời bài nộp, điểm tổng kết; tiến độ ải khối 3-5 đọc từ block_puzzle_progress (không bảng riêng). */
@Module({
  imports: [
    DatabaseModule,
    CommonAuthModule,
    MongooseModule.forFeature([
      { name: Assessment.name, schema: AssessmentSchema },
      { name: AssessmentSubmission.name, schema: AssessmentSubmissionSchema },
    ]),
  ],
  controllers: [TeacherAssessmentController, StudentAssessmentController, CareerLabClassController],
  providers: [AssessmentService, KidProgressService, CareerLabClassService],
  exports: [AssessmentService, KidProgressService],
})
export class AssessmentModule {}
