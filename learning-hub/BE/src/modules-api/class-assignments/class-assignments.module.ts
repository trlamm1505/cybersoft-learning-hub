import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { ClassAssignmentsService } from './class-assignments.service';
import { StudentClassAssignmentsController, TeacherClassAssignmentsController } from './class-assignments.controller';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [StudentClassAssignmentsController, TeacherClassAssignmentsController],
  providers: [ClassAssignmentsService],
  exports: [ClassAssignmentsService],
})
export class ClassAssignmentsModule {}
