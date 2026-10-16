import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { MAX_ROSTER_BYTES } from './roster-import';
import type { RosterFile } from './roster-import';
import { TeacherAnalyticsService } from './teacher-analytics.service';
import type { ClassInput } from './teacher-analytics.service';

/**
 * Quản trị lớp học: chỉ ADMIN (giảng viên và học viên nhận 403). Admin tạo lớp, gán giảng viên phụ
 * trách, sửa/lưu trữ/xóa lớp và quản lý học viên (thêm tay hoặc import Excel/CSV). Service kiểm tra
 * lại vai trò một lần nữa nên đổi decorator nhầm cũng không mở quyền cho giảng viên.
 */
@Controller('admin/classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminClassesController {
  constructor(private readonly service: TeacherAnalyticsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.service.listAllClasses(user, true);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: ClassInput) {
    return this.service.createClass(user, body ?? {});
  }

  // Khai báo trước các route có :classId để "catalog" không bị hiểu là id lớp.
  @Get('catalog/teachers')
  catalogTeachers(@CurrentUser() user: JwtPayload, @Query('q') q?: string) {
    return this.service.catalogTeachers(user, q);
  }

  @Get('catalog/students')
  catalogStudents(@CurrentUser() user: JwtPayload, @Query('q') q?: string) {
    return this.service.catalogStudents(user, q);
  }

  @Get(':classId')
  detail(@CurrentUser() user: JwtPayload, @Param('classId') classId: string) {
    return this.service.getClassDetail(user, classId);
  }

  @Put(':classId')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('classId') classId: string,
    @Body() body: ClassInput,
  ) {
    return this.service.updateClass(user, classId, body ?? {});
  }

  @Delete(':classId')
  remove(@CurrentUser() user: JwtPayload, @Param('classId') classId: string) {
    return this.service.deleteClass(user, classId);
  }

  @Post(':classId/students')
  addStudents(
    @CurrentUser() user: JwtPayload,
    @Param('classId') classId: string,
    @Body() body: { identifiers?: unknown },
  ) {
    return this.service.addStudents(user, classId, body?.identifiers);
  }

  /** multipart/form-data, trường `file`; multer từ chối file quá 2MB trước khi vào service. */
  @Post(':classId/students/import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_ROSTER_BYTES, files: 1, fields: 0 },
    }),
  )
  importStudents(
    @CurrentUser() user: JwtPayload,
    @Param('classId') classId: string,
    @UploadedFile() file?: RosterFile,
  ) {
    return this.service.importStudents(user, classId, file);
  }

  @Delete(':classId/students/:studentId')
  removeStudent(
    @CurrentUser() user: JwtPayload,
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.service.removeStudent(user, classId, studentId);
  }
}
