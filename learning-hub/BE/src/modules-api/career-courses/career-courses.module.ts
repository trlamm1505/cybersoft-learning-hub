import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { CareerCoursesController } from './career-courses.controller';
import { CareerCoursesService } from './career-courses.service';

@Module({
  imports: [DatabaseModule, CommonAuthModule],
  controllers: [CareerCoursesController],
  providers: [CareerCoursesService],
  exports: [CareerCoursesService],
})
export class CareerCoursesModule {}
