import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { AuthoringController } from '../authoring/authoring.controller';
import { assertLessonOwnership } from '../authoring/authoring.service';
import { assertCanModifyExercise } from '../exercise/exercise-usage';

/**
 * Day 29 (SEC-22, PRV-08): mục QA "security-idor-authoring" trước đây là fixture tĩnh luôn PASSED. Probe này chạy THẬT
 * các hàm phân quyền đang được AuthoringService/ExerciseService dùng, cộng với kiểm tra guard trên route sửa/xóa, và
 * trả FAILED nếu bất kỳ kịch bản nào cho phép giảng viên B đụng vào bài của giảng viên A.
 */
export interface ProbeResult {
  passed: boolean;
  details: string;
}

const forbidden = (fn: () => void): boolean => {
  try {
    fn();
    return false;
  } catch (e) {
    return e instanceof ForbiddenException;
  }
};
const allowed = (fn: () => void): boolean => {
  try {
    fn();
    return true;
  } catch {
    return false;
  }
};

export function runAuthoringIdorProbe(): ProbeResult {
  const A = { sub: 'teacher-A', role: 'TEACHER' };
  const B = { sub: 'teacher-B', role: 'TEACHER' };
  const admin = { sub: 'admin', role: 'ADMIN' };
  const guards = (m: 'updateLesson' | 'deleteLesson' | 'findOne') =>
    (Reflect.getMetadata(GUARDS_METADATA, (AuthoringController.prototype as any)[m]) ?? []) as unknown[];

  const checks: Array<[string, boolean]> = [
    ['B sửa/xóa lesson của A → 403', forbidden(() => assertLessonOwnership({ authorId: A.sub }, B))],
    ['A sửa lesson của chính mình → cho phép', allowed(() => assertLessonOwnership({ authorId: A.sub }, A))],
    ['Admin sửa lesson của A → cho phép', allowed(() => assertLessonOwnership({ authorId: A.sub }, admin))],
    ['B xóa exercise Ngân hàng đề của A qua /authoring → 403', forbidden(() => assertCanModifyExercise({ bankOnly: true, authorId: A.sub }, B as never))],
    ['Bài Playground cố định → 403 kể cả Admin', forbidden(() => assertCanModifyExercise({}, admin as never))],
    ['PUT/DELETE/GET :id có JwtAuthGuard + RolesGuard', (['updateLesson', 'deleteLesson', 'findOne'] as const).every((m) => guards(m).includes(JwtAuthGuard) && guards(m).includes(RolesGuard))],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
  return {
    passed: failed.length === 0,
    details: failed.length ? `Kịch bản thất bại: ${failed.join('; ')}` : `${checks.length}/${checks.length} kịch bản IDOR authoring bị chặn đúng`,
  };
}
