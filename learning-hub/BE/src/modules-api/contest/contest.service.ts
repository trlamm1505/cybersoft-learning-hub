import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contest, ContestDocument } from '../../modules-system/database/schemas/contest.schema';
import { CreateContestDto } from './dto/create-contest.dto';
import { UpdateContestDto } from './dto/update-contest.dto';
import { RegisterContestDto } from './dto/register-contest.dto';

import { getInitialContests } from '../../data/initial-contests';

@Injectable()
export class ContestService implements OnModuleInit {
  constructor(
    @InjectModel(Contest.name)
    private readonly contestModel: Model<ContestDocument>,
  ) {}

  async onModuleInit() {
    await this.seedSampleContests();
  }

  private async seedSampleContests() {
    try {
      const count = await this.contestModel.countDocuments();
      if (count === 0) {
        const sampleContests = getInitialContests();
        await this.contestModel.insertMany(sampleContests);
        console.log(`✅ Seeded ${sampleContests.length} sample contests into MongoDB for Contest Module`);
      }
    } catch (error) {
      console.warn('Could not seed sample contests:', error.message);
    }
  }

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `contest-${Date.now()}`
    );
  }

  private computeStatus(startTime: Date, endTime: Date): {
    status: 'UPCOMING' | 'ONGOING' | 'ENDED';
    statusText: string;
  } {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) {
      return { status: 'UPCOMING', statusText: 'Sắp diễn ra' };
    }
    if (now > end) {
      return { status: 'ENDED', statusText: 'Đã kết thúc' };
    }
    return { status: 'ONGOING', statusText: 'Đang diễn ra' };
  }

  async createContest(dto: CreateContestDto): Promise<Contest> {
    if (!dto.title || !dto.title.trim()) {
      throw new BadRequestException('Tiêu đề cuộc thi không được để trống!');
    }

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Thời gian bắt đầu hoặc kết thúc không hợp lệ!');
    }

    if (start >= end) {
      throw new BadRequestException('Thời gian bắt đầu phải trước thời gian kết thúc!');
    }

    const slug = dto.slug && dto.slug.trim() ? dto.slug.trim() : this.generateSlug(dto.title);
    const existing = await this.contestModel.findOne({ slug }).exec();
    if (existing) {
      throw new BadRequestException(`Slug '${slug}' đã tồn tại. Vui lòng chọn tiêu đề hoặc slug khác.`);
    }

    const durationMinutes =
      dto.durationMinutes && dto.durationMinutes > 0
        ? dto.durationMinutes
        : Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));

    const newContest = new this.contestModel({
      ...dto,
      slug,
      startTime: start,
      endTime: end,
      durationMinutes,
      problems: dto.problems || [],
      registrations: [],
      status: dto.status || 'published',
      authorId: dto.authorId || 'teacher-1',
    });

    return newContest.save();
  }

  async updateContest(id: string, dto: UpdateContestDto): Promise<Contest> {
    const contest = await this.contestModel.findById(id);
    if (!contest) {
      throw new NotFoundException(`Không tìm thấy cuộc thi với ID: ${id}`);
    }

    const startTime = dto.startTime ? new Date(dto.startTime) : contest.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : contest.endTime;

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestException('Thời gian bắt đầu hoặc kết thúc không hợp lệ!');
    }

    if (startTime >= endTime) {
      throw new BadRequestException('Thời gian bắt đầu phải trước thời gian kết thúc!');
    }

    const durationMinutes =
      dto.durationMinutes && dto.durationMinutes > 0
        ? dto.durationMinutes
        : Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));

    Object.assign(contest, {
      ...dto,
      startTime,
      endTime,
      durationMinutes,
    });

    return contest.save();
  }

  async findAll(studentId?: string) {
    const filter: any = studentId ? { status: { $ne: 'draft' } } : {};
    const contests = await this.contestModel.find(filter).sort({ startTime: -1 }).exec();
    const serverTime = new Date();

    return contests.map((c) => {
      const { status: computedStatus, statusText } = this.computeStatus(c.startTime, c.endTime);
      const isRegistered = studentId
        ? c.registrations?.some((r) => r.studentId === studentId) || false
        : false;

      return {
        ...c.toObject(),
        serverTime: serverTime.toISOString(),
        computedStatus,
        statusText,
        isRegistered,
        registrationsCount: c.registrations?.length || 0,
      };
    });
  }

  async findOne(id: string, studentId?: string) {
    const contest = await this.contestModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }],
    }).exec();

    if (!contest) {
      throw new NotFoundException(`Không tìm thấy cuộc thi với thông tin: ${id}`);
    }

    const serverTime = new Date();
    const { status: computedStatus, statusText } = this.computeStatus(contest.startTime, contest.endTime);
    const isRegistered = studentId
      ? contest.registrations?.some((r) => r.studentId === studentId) || false
      : false;

    return {
      ...contest.toObject(),
      serverTime: serverTime.toISOString(),
      computedStatus,
      statusText,
      isRegistered,
      registrationsCount: contest.registrations?.length || 0,
    };
  }

  async registerContest(id: string, dto: RegisterContestDto) {
    if (!dto.studentId || !dto.studentId.trim()) {
      throw new BadRequestException('Mã học viên (studentId) không được để trống!');
    }

    const contest = await this.contestModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }],
    }).exec();

    if (!contest) {
      throw new NotFoundException(`Không tìm thấy cuộc thi với ID hoặc slug: ${id}`);
    }

    const now = new Date();
    if (now > contest.endTime) {
      throw new BadRequestException('Cuộc thi này đã kết thúc! Bạn không thể đăng ký tham gia nữa.');
    }

    const isAlreadyRegistered = contest.registrations.some((r) => r.studentId === dto.studentId);
    if (isAlreadyRegistered) {
      return {
        success: true,
        message: 'Học viên đã đăng ký tham gia cuộc thi từ trước!',
        isRegistered: true,
        contestId: contest._id,
        contestTitle: contest.title,
      };
    }

    contest.registrations.push({
      studentId: dto.studentId,
      studentName: dto.studentName || 'Học viên',
      registeredAt: now,
    });

    await contest.save();

    return {
      success: true,
      message: 'Đăng ký tham gia cuộc thi thành công!',
      isRegistered: true,
      contestId: contest._id,
      contestTitle: contest.title,
      registeredAt: now.toISOString(),
    };
  }

  async checkContestStatus(id: string, studentId?: string) {
    const contest = await this.contestModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }],
    }).exec();

    if (!contest) {
      throw new NotFoundException(`Không tìm thấy cuộc thi với ID hoặc slug: ${id}`);
    }

    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    const { status: computedStatus, statusText } = this.computeStatus(start, end);
    const isRegistered = studentId
      ? contest.registrations.some((r) => r.studentId === studentId)
      : false;

    const isAllowedToJoin = computedStatus === 'ONGOING' && isRegistered;
    const isAllowedToSubmit = computedStatus === 'ONGOING' && isRegistered;

    let message = '';
    if (computedStatus === 'UPCOMING') {
      message = 'Cuộc thi chưa bắt đầu. Thời gian máy chủ chưa đạt giờ mở đề.';
    } else if (computedStatus === 'ENDED') {
      message = 'Cuộc thi đã kết thúc. Máy chủ đã khóa quyền nộp bài và làm đề thi.';
    } else if (!isRegistered) {
      message = 'Bạn chưa đăng ký tham gia cuộc thi này! Vui lòng bấm nút "Đăng ký tham gia" trước khi làm bài thi.';
    } else {
      message = 'Cuộc thi đang diễn ra hợp lệ theo thời gian máy chủ và bạn đã đăng ký tham gia thành công.';
    }

    const timeRemainingSeconds =
      computedStatus === 'ONGOING' ? Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000)) : 0;
    const countdownSeconds =
      computedStatus === 'UPCOMING' ? Math.max(0, Math.floor((start.getTime() - now.getTime()) / 1000)) : 0;

    return {
      contestId: contest._id,
      slug: contest.slug,
      title: contest.title,
      serverTime: now.toISOString(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      computedStatus,
      statusText,
      isRegistered,
      isAllowedToJoin,
      isAllowedToSubmit,
      timeRemainingSeconds,
      countdownSeconds,
      message,
    };
  }

  async deleteContest(id: string) {
    const contest = await this.contestModel.findByIdAndDelete(id);
    if (!contest) {
      throw new NotFoundException(`Không tìm thấy cuộc thi với ID: ${id}`);
    }
    return { success: true, message: `Đã xóa thành công cuộc thi: ${contest.title}` };
  }
}
