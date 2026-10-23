import { BadRequestException } from '@nestjs/common';

export class CreateAssignmentDto {
  type?: string;
  title?: string;
  exerciseSlug?: string;
  questionIds?: string[];
  maxPoints?: number;
  startAt?: string | Date;
  dueAt?: string | Date;
}

export interface ValidAssignmentInput {
  type: 'CODING' | 'QUIZ';
  title: string;
  exerciseSlug?: string;
  questionIds?: string[];
  maxPoints: number;
  startAt: Date;
  dueAt: Date;
}

const MAX_TITLE = 200;

/** Kiểm tra dữ liệu giao bài; chỉ giữ các trường cho phép (không nhận classId/createdBy từ client). */
export function validateAssignmentInput(dto: CreateAssignmentDto): ValidAssignmentInput {
  if (dto?.type !== 'CODING' && dto?.type !== 'QUIZ') {
    throw new BadRequestException("type chỉ nhận 'CODING' hoặc 'QUIZ'.");
  }
  const title = typeof dto.title === 'string' ? dto.title.trim() : '';
  if (!title || title.length > MAX_TITLE) {
    throw new BadRequestException(`Tiêu đề bắt buộc, tối đa ${MAX_TITLE} ký tự.`);
  }
  const startAt = new Date(dto.startAt as string);
  const dueAt = new Date(dto.dueAt as string);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(dueAt.getTime())) {
    throw new BadRequestException('Thời gian bắt đầu và hạn chót không hợp lệ.');
  }
  if (dueAt.getTime() <= startAt.getTime()) {
    throw new BadRequestException('Hạn chót phải sau thời gian bắt đầu.');
  }
  const maxPoints = dto.maxPoints === undefined ? 10 : Number(dto.maxPoints);
  if (!Number.isFinite(maxPoints) || maxPoints < 1 || maxPoints > 100) {
    throw new BadRequestException('Tổng điểm phải từ 1 đến 100.');
  }
  if (dto.type === 'CODING') {
    const slug = typeof dto.exerciseSlug === 'string' ? dto.exerciseSlug.trim() : '';
    if (!slug) throw new BadRequestException('Bài code cần exerciseSlug.');
    return { type: 'CODING', title, exerciseSlug: slug, maxPoints, startAt, dueAt };
  }
  const ids = Array.isArray(dto.questionIds) ? [...new Set(dto.questionIds.map(String))] : [];
  if (ids.length === 0 || ids.length > 100) {
    throw new BadRequestException('Bài trắc nghiệm cần từ 1 đến 100 câu hỏi.');
  }
  return { type: 'QUIZ', title, questionIds: ids, maxPoints, startAt, dueAt };
}
