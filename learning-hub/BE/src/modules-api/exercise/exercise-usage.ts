import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { Model } from 'mongoose';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

export const BANK_IN_USE_MESSAGE = 'Không thể xóa bài tập đang được sử dụng trong Lớp học hoặc Cuộc thi';
export const PLAYGROUND_FIXED_MESSAGE = 'Bài thuộc kho Code Playground cố định: chỉ xem, không sửa hoặc xóa.';

export interface UsageModels {
  /** class_assignments (luồng giao bài có hạn chót). */
  assignments?: Pick<Model<any>, 'aggregate'>;
  /** classrooms (luồng giao bài cũ theo exerciseSlugs). */
  classes?: Pick<Model<any>, 'aggregate'>;
  contests?: Pick<Model<any>, 'find'>;
}

/**
 * Số lớp / cuộc thi đang dùng từng slug. "Lớp" gồm cả bài giao (class_assignments CODING) lẫn danh mục bài cũ của lớp
 * (classrooms.exerciseSlugs) — thiếu nguồn sau là kẽ hở xóa bài khiến lớp trỏ tới bài không còn tồn tại.
 */
export async function exerciseUsage(m: UsageModels, slugs: string[]): Promise<Map<string, { classes: number; contests: number }>> {
  const out = new Map<string, { classes: number; contests: number }>(slugs.map((s) => [s, { classes: 0, contests: 0 }]));
  if (slugs.length === 0) return out;
  const [fromAssignments, fromClasses, fromContests] = await Promise.all([
    m.assignments ? m.assignments.aggregate<{ _id: string; n: number }>([{ $match: { type: 'CODING', exerciseSlug: { $in: slugs } } }, { $group: { _id: '$exerciseSlug', n: { $sum: 1 } } }]) : [],
    m.classes && typeof m.classes.aggregate === 'function'
      ? m.classes.aggregate<{ _id: string; n: number }>([{ $match: { exerciseSlugs: { $in: slugs } } }, { $unwind: '$exerciseSlugs' }, { $match: { exerciseSlugs: { $in: slugs } } }, { $group: { _id: '$exerciseSlugs', n: { $sum: 1 } } }])
      : [],
    m.contests
      ? m.contests
          .find({ $or: [{ 'problems.exerciseSlug': { $in: slugs } }, { problems: { $elemMatch: { source: 'exercise', slug: { $in: slugs } } } }] })
          .select('problems')
          .lean<Array<{ problems?: Array<{ exerciseSlug?: string; slug?: string; source?: string }> }>>()
      : [],
  ]);
  for (const r of [...fromAssignments, ...fromClasses]) if (out.has(r._id)) out.get(r._id)!.classes += r.n;
  for (const c of fromContests) {
    const hit = new Set<string>();
    for (const p of c.problems ?? []) {
      if (p.exerciseSlug && out.has(p.exerciseSlug)) hit.add(p.exerciseSlug);
      if (p.source === 'exercise' && p.slug && out.has(p.slug)) hit.add(p.slug);
    }
    for (const s of hit) out.get(s)!.contests += 1;
  }
  return out;
}

/** 409 nếu bài đang được dùng ở lớp hoặc cuộc thi. */
export async function assertExerciseNotInUse(m: UsageModels, slug: string): Promise<void> {
  const use = (await exerciseUsage(m, [slug])).get(slug)!;
  if (use.classes + use.contests > 0) {
    throw new ConflictException({ code: 'E409_BANK_EXERCISE_IN_USE', message: BANK_IN_USE_MESSAGE, usage: use });
  }
}

/** Bài hệ thống của Code Playground: không do ai tạo (không authorId) và không thuộc Ngân hàng đề. */
export const isPlaygroundFixed = (ex: { bankOnly?: boolean; authorId?: string | null }): boolean => ex.bankOnly !== true && !ex.authorId;

/**
 * Quyền sửa/xóa một bài tập: ADMIN được mọi bài (trừ bài Playground cố định khi requireEditable); giảng viên chỉ bài do
 * chính mình tạo, hoặc bài Ngân hàng đề không có tác giả (bài chung).
 */
export function assertCanModifyExercise(ex: { bankOnly?: boolean; authorId?: string | null }, user: JwtPayload): void {
  if (isPlaygroundFixed(ex)) {
    throw new ForbiddenException({ code: 'E403_PLAYGROUND_FIXED', message: PLAYGROUND_FIXED_MESSAGE });
  }
  if (user.role === 'ADMIN') return;
  if (ex.authorId && ex.authorId !== user.sub) {
    throw new ForbiddenException({ code: 'E403_NOT_OWNER', message: 'Bạn chỉ được sửa/xóa bài tập do chính mình tạo.' });
  }
}
