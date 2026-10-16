import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { AdminClassesController } from './admin-classes.controller';
import { StudentClassesController } from './student-classes.controller';
import { TeacherAnalyticsController } from './teacher-analytics.controller';
import { TeacherAnalyticsService } from './teacher-analytics.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [
    TeacherAnalyticsController,
    AdminClassesController,
    StudentClassesController,
  ],
  providers: [TeacherAnalyticsService],
})
export class TeacherAnalyticsModule {}
