import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { CareerCoursesModule } from '../career-courses/career-courses.module';
import { ClassAssignmentsService } from './class-assignments.service';
import { StudentClassAssignmentsController, TeacherClassAssignmentsController } from './class-assignments.controller';

@Module({
  imports: [DatabaseModule, CommonAuthModule, CareerCoursesModule],
  controllers: [StudentClassAssignmentsController, TeacherClassAssignmentsController],
  providers: [ClassAssignmentsService],
  exports: [ClassAssignmentsService],
})
export class ClassAssignmentsModule {}
