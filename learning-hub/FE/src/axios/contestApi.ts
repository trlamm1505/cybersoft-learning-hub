import axios from 'axios';
import type { ContestItem, ContestStatusResponse } from '../types/contest';

const API_BASE_URL = 'http://localhost:3000/api/contests';

const getLocalContests = (): ContestItem[] => {
  try {
    const local = localStorage.getItem('app_saved_contests');
    return local ? JSON.parse(local) : [];
  } catch {
    return [];
  }
};

const saveLocalContests = (list: ContestItem[]) => {
  try {
    localStorage.setItem('app_saved_contests', JSON.stringify(list));
  } catch {
    /* ignore */
  }
};

export const contestApi = {
  getContests: async (studentId?: string): Promise<ContestItem[]> => {
    try {
      const res = await axios.get(API_BASE_URL, {
        params: studentId ? { studentId } : undefined,
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        saveLocalContests(res.data);
        return res.data;
      }
      return getLocalContests();
    } catch {
      return getLocalContests();
    }
  },

  getContestById: async (id: string, studentId?: string): Promise<ContestItem> => {
    try {
      const res = await axios.get(`${API_BASE_URL}/${id}`, {
        params: studentId ? { studentId } : undefined,
      });
      return res.data;
    } catch {
      const local = getLocalContests();
      const found = local.find((c) => c._id === id || c.slug === id);
      if (found) return found;
      throw new Error('Không tìm thấy cuộc thi!');
    }
  },

  createContest: async (dto: Partial<ContestItem>): Promise<ContestItem> => {
    try {
      // Try primary POST endpoint /api/contests
      const res = await axios.post(API_BASE_URL, dto);
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        try {
          // Try legacy endpoint /api/contests/create
          const res2 = await axios.post(`${API_BASE_URL}/create`, dto);
          return res2.data;
        } catch {
          /* continue to fallback */
        }
      }

      // Offline / server restart fallback to local storage
      const now = new Date();
      const newContest: ContestItem = {
        _id: `contest-local-${Date.now()}`,
        title: dto.title || 'Cuộc thi mới',
        slug: dto.slug || `contest-${Date.now()}`,
        description: dto.description || '',
        startTime: dto.startTime || now.toISOString(),
        endTime: dto.endTime || new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
        durationMinutes: dto.durationMinutes || 90,
        problems: dto.problems || [],
        registrations: [],
        status: dto.status || 'published',
        authorId: dto.authorId || 'teacher-1',
        createdAt: now.toISOString(),
      };

      const localList = getLocalContests();
      const updatedList = [newContest, ...localList];
      saveLocalContests(updatedList);
      return newContest;
    }
  },

  updateContest: async (id: string, dto: Partial<ContestItem>): Promise<ContestItem> => {
    try {
      const res = await axios.put(`${API_BASE_URL}/${id}`, dto);
      return res.data;
    } catch {
      const localList = getLocalContests();
      const updatedList = localList.map((c) => {
        if (c._id === id || c.slug === id) {
          return { ...c, ...dto };
        }
        return c;
      });
      saveLocalContests(updatedList);
      const updated = updatedList.find((c) => c._id === id || c.slug === id);
      return updated || (dto as ContestItem);
    }
  },

  registerContest: async (
    id: string,
    studentId: string,
    studentName?: string,
  ): Promise<{ success: boolean; message: string; isRegistered: boolean }> => {
    try {
      const res = await axios.post(`${API_BASE_URL}/${id}/register`, {
        studentId,
        studentName,
      });
      return res.data;
    } catch {
      const localList = getLocalContests();
      const target = localList.find((c) => c._id === id || c.slug === id);
      if (target) {
        if (!target.registrations) target.registrations = [];
        const exists = target.registrations.some((r) => r.studentId === studentId);
        if (!exists) {
          target.registrations.push({
            studentId,
            studentName: studentName || 'Học viên',
            registeredAt: new Date().toISOString(),
          });
          saveLocalContests(localList);
        }
      }
      return {
        success: true,
        message: 'Đăng ký tham gia cuộc thi thành công!',
        isRegistered: true,
      };
    }
  },

  checkContestStatus: async (id: string, studentId?: string): Promise<ContestStatusResponse> => {
    try {
      const res = await axios.get(`${API_BASE_URL}/${id}/status`, {
        params: studentId ? { studentId } : undefined,
      });
      return res.data;
    } catch {
      const localList = getLocalContests();
      const c = localList.find((item) => item._id === id || item.slug === id);
      const now = new Date();
      const start = c ? new Date(c.startTime) : now;
      const end = c ? new Date(c.endTime) : new Date(now.getTime() + 90 * 60 * 1000);

      let computedStatus: 'UPCOMING' | 'ONGOING' | 'ENDED' = 'ONGOING';
      let statusText = 'Đang diễn ra';
      let message = 'Cuộc thi đang diễn ra hợp lệ.';

      const isRegistered = studentId
        ? c?.registrations?.some((r) => r.studentId === studentId) || false
        : false;

      if (now < start) {
        computedStatus = 'UPCOMING';
        statusText = 'Sắp diễn ra';
        message = 'Cuộc thi chưa bắt đầu. Thời gian máy chủ chưa đạt giờ mở đề.';
      } else if (now > end) {
        computedStatus = 'ENDED';
        statusText = 'Đã kết thúc';
        message = 'Cuộc thi đã kết thúc. Máy chủ đã khóa quyền nộp bài và làm đề thi.';
      } else if (!isRegistered) {
        message = 'Bạn chưa đăng ký tham gia cuộc thi này! Vui lòng bấm nút "Đăng ký tham gia" trước khi làm bài thi.';
      }

      const isAllowedToJoin = computedStatus === 'ONGOING' && isRegistered;
      const isAllowedToSubmit = computedStatus === 'ONGOING' && isRegistered;

      return {
        contestId: id,
        slug: c?.slug || id,
        title: c?.title || 'Cuộc thi',
        serverTime: now.toISOString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        computedStatus,
        statusText,
        isRegistered,
        isAllowedToJoin,
        isAllowedToSubmit,
        timeRemainingSeconds:
          computedStatus === 'ONGOING' ? Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000)) : 0,
        countdownSeconds:
          computedStatus === 'UPCOMING' ? Math.max(0, Math.floor((start.getTime() - now.getTime()) / 1000)) : 0,
        message,
      };
    }
  },

  deleteContest: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/${id}`);
      return res.data;
    } catch {
      const localList = getLocalContests();
      const filtered = localList.filter((c) => c._id !== id && c.slug !== id);
      saveLocalContests(filtered);
      return { success: true, message: 'Đã xóa cuộc thi thành công' };
    }
  },
};
