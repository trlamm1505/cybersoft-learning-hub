import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { Classroom, ClassroomDocument } from '../../modules-system/database/schemas/classroom.schema';
import { Lesson, LessonDocument } from '../../modules-system/database/schemas/lesson.schema';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import { BlockPuzzleProgress, BlockPuzzleProgressDocument } from '../../modules-system/database/schemas/block-puzzle-progress.schema';
import { buildGameSlugs } from '../block-puzzle/block-puzzle-games';
import { deriveKidProgress, type CompletedLevel } from './domain/kid-progress';

type ClassLean = Classroom & { _id: unknown };

/**
 * Tiến độ ải khối 3-5 cho giảng viên. KHÔNG có bảng riêng: mọi con số lấy từ `block_puzzle_progress` (một bản ghi = một màn bé đã
 * hoàn thành), đúng nguồn mà hồ sơ của bé (/profile) và bảng xếp hạng Block Puzzle đang đọc, nên hai bên không thể lệch nhau.
 */
@Injectable()
export class KidProgressService {
  constructor(
    @InjectModel(BlockPuzzleProgress.name) private readonly progress: Model<BlockPuzzleProgressDocument>,
    @InjectModel(Classroom.name) private readonly classes: Model<ClassroomDocument>,
    @InjectModel(Lesson.name) private readonly lessons: Model<LessonDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
  ) {}

  private async loadKidClass(classId: string): Promise<ClassLean> {
    if (!isValidObjectId(classId)) throw new NotFoundException('Không tìm thấy lớp.');
    const cls = await this.classes.findById(classId).lean<ClassLean>();
    if (!cls) throw new NotFoundException('Không tìm thấy lớp.');
    if (cls.ageGroup !== '3-5') throw new BadRequestException({ code: 'E400_NOT_KID_CLASS', message: 'Tiến độ ải chỉ dành cho lớp khối 3-5.' });
    return cls;
  }

  /** Giảng viên phụ trách lớp (hoặc Admin) xem tiến độ từng bé; bé bị kẹt đứng đầu, rồi theo số sao giảm dần. */
  async listForTeacher(user: JwtPayload, classId: string, now = new Date()) {
    const cls = await this.loadKidClass(classId);
    const isTeacher = cls.teacherId === user.sub || (cls.teacherIds ?? []).includes(user.sub);
    if (user.role !== 'ADMIN' && !(user.role === 'TEACHER' && isTeacher)) {
      throw new ForbiddenException({ code: 'E403_CLASS_NOT_OWNED', message: 'Chỉ giảng viên phụ trách lớp xem được tiến độ ải.' });
    }
    const studentIds = cls.studentIds ?? [];
    if (studentIds.length === 0) return [];

    const [rows, lessonRows, people] = await Promise.all([
      this.progress.find({ userId: { $in: studentIds } }).select('userId lessonSlug gameId completedAt').lean<Array<{ userId: string; lessonSlug: string; gameId: string; completedAt: Date }>>(),
      this.lessons.find({ type: 'block' }).select('slug status blockPuzzle.gameId').lean(),
      this.users.find({ _id: { $in: studentIds.filter(isValidObjectId) }, role: 'STUDENT' }).select('fullName').lean<Array<{ _id: unknown; fullName?: string }>>(),
    ]);
    const validSlugs = buildGameSlugs(lessonRows as never);
    const byUser = new Map<string, CompletedLevel[]>();
    for (const r of rows) byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), { gameId: r.gameId, slug: r.lessonSlug, completedAt: r.completedAt }]);

    return people
      .map((p) => {
        const id = String(p._id);
        return { studentId: id, fullName: p.fullName ?? '', ...deriveKidProgress(byUser.get(id) ?? [], validSlugs, now) };
      })
      .sort((a, b) => Number(b.stuckAlert.active) - Number(a.stuckAlert.active) || b.starsEarned - a.starsEarned || a.fullName.localeCompare(b.fullName, 'vi'));
  }
}
