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
import { AuditLogService } from '../admin-portal/audit-log.service';
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
  constructor(
    private readonly service: TeacherAnalyticsService,
    private readonly audit: AuditLogService,
  ) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.service.listAllClasses(user, true);
  }

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: ClassInput) {
    const created = await this.service.createClass(user, body ?? {});
    const ctx = await this.service.auditContext(created.id);
    await this.audit.record(user, 'CLASS_CREATE', 'CLASS', created.id, null, { className: ctx.className, description: ctx.description, teacherNames: ctx.teacherNames });
    return created;
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
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('classId') classId: string,
    @Body() body: ClassInput,
  ) {
    const before = await this.service.auditContext(classId);
    const result = await this.service.updateClass(user, classId, body ?? {});
    const after = await this.service.auditContext(classId);
    const pick = (c: typeof before) => ({ className: c.className, description: c.description, archived: c.archived, teacherNames: c.teacherNames });
    if (JSON.stringify(pick(before)) !== JSON.stringify(pick(after))) await this.audit.record(user, 'CLASS_UPDATE', 'CLASS', classId, pick(before), pick(after));
    return result;
  }

  @Delete(':classId')
  async remove(@CurrentUser() user: JwtPayload, @Param('classId') classId: string) {
    const before = await this.service.auditContext(classId);
    const result = await this.service.deleteClass(user, classId);
    await this.audit.record(user, 'CLASS_DELETE', 'CLASS', classId, { className: before.className, teacherNames: before.teacherNames }, null);
    return result;
  }

  @Post(':classId/students')
  async addStudents(
    @CurrentUser() user: JwtPayload,
    @Param('classId') classId: string,
    @Body() body: { identifiers?: unknown },
  ) {
    const result = await this.service.addStudents(user, classId, body?.identifiers);
    await this.recordAdded(user, classId, result.added);
    return result;
  }

  private async recordAdded(user: JwtPayload, classId: string, added: Array<{ id: string; name: string }>) {
    if (added.length === 0) return;
    const ctx = await this.service.auditContext(classId);
    await this.audit.record(user, 'STUDENT_ADD', 'CLASS', classId, { className: ctx.className, students: [] }, { className: ctx.className, students: added.map((a) => a.name) });
  }

  /** multipart/form-data, trường `file`; multer từ chối file quá 2MB trước khi vào service. */
  @Post(':classId/students/import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_ROSTER_BYTES, files: 1, fields: 0 },
    }),
  )
  async importStudents(
    @CurrentUser() user: JwtPayload,
    @Param('classId') classId: string,
    @UploadedFile() file?: RosterFile,
  ) {
    const result = await this.service.importStudents(user, classId, file);
    await this.recordAdded(user, classId, result.added);
    return result;
  }

  @Delete(':classId/students/:studentId')
  async removeStudent(
    @CurrentUser() user: JwtPayload,
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ) {
    const ctx = await this.service.auditContext(classId, [studentId]);
    const result = await this.service.removeStudent(user, classId, studentId);
    await this.audit.record(user, 'STUDENT_REMOVE', 'CLASS', classId, { className: ctx.className, students: [ctx.nameOf(studentId)] }, { className: ctx.className, students: [] });
    return result;
  }
}
