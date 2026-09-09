import React, { useState, useEffect, useCallback } from 'react';
import type { ContestItem, ContestProblem } from '../types/contest';
import type { LessonAuthoring } from '../types/authoring';
import { contestApi } from '../axios/contestApi';
import { authoringApi } from '../axios/authoringApi';

const DEFAULT_CONTEST: Partial<ContestItem> = {
  title: '',
  slug: '',
  description: '',
  durationMinutes: 90,
  status: 'published',
  problems: [],
};

const toLocalISOString = (d: Date): string => {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
};

export const TeacherContestAuthoring: React.FC = () => {
  const [contests, setContests] = useState<ContestItem[]>([]);
  const [lessons, setLessons] = useState<LessonAuthoring[]>([]);
  const [formData, setFormData] = useState<Partial<ContestItem>>(() => {
    const now = new Date();
    const startTimeStr = toLocalISOString(now);
    const endTimeStr = toLocalISOString(new Date(now.getTime() + 90 * 60 * 1000));
    return {
      ...DEFAULT_CONTEST,
      startTime: startTimeStr,
      endTime: endTimeStr,
    };
  });

  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [contestList, lessonList] = await Promise.all([
        contestApi.getContests(),
        authoringApi.getLessons(),
      ]);
      if (Array.isArray(contestList)) setContests(contestList);
      if (Array.isArray(lessonList)) setLessons(lessonList);
    } catch {
      showToast('Đang chạy ở chế độ cục bộ hoặc chưa kết nối backend server.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApplyPresetDuration = (minutes: number) => {
    const now = new Date();
    const defaultEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setFormData((prev) => ({
      ...prev,
      durationMinutes: minutes,
      startTime: prev.startTime || toLocalISOString(now),
      endTime: prev.endTime || toLocalISOString(defaultEnd),
    }));
    showToast(`Đã thiết lập thời lượng đếm ngược: ${minutes} phút`, 'success');
  };

  const handleToggleProblem = (lesson: LessonAuthoring) => {
    setFormData((prev) => {
      const currentProblems = prev.problems || [];
      const exists = currentProblems.some(
        (p) => p.lessonId === lesson._id || p.slug === lesson.slug,
      );

      let updated: ContestProblem[];
      if (exists) {
        updated = currentProblems.filter(
          (p) => p.lessonId !== lesson._id && p.slug !== lesson.slug,
        );
      } else {
        const newProblem: ContestProblem = {
          lessonId: lesson._id,
          title: lesson.title,
          slug: lesson.slug,
          type: lesson.type,
          points: lesson.points || 100,
          order: currentProblems.length + 1,
        };
        updated = [...currentProblems, newProblem];
      }

      return { ...prev, problems: updated };
    });
  };

  const handleOpenCreateModal = () => {
    const now = new Date();
    setSelectedContestId(null);
    setFormData({
      ...DEFAULT_CONTEST,
      title: '',
      description: '',
      startTime: toLocalISOString(now),
      endTime: toLocalISOString(new Date(now.getTime() + 90 * 60 * 1000)),
      durationMinutes: 90,
      status: 'published',
      problems: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: ContestItem) => {
    const targetId = c._id || c.slug || null;
    setSelectedContestId(targetId);
    setFormData({
      _id: c._id,
      title: c.title,
      slug: c.slug,
      description: c.description || '',
      startTime: toLocalISOString(new Date(c.startTime)),
      endTime: toLocalISOString(new Date(c.endTime)),
      durationMinutes: c.durationMinutes || 90,
      status: c.status || 'published',
      problems: c.problems || [],
    });
    setIsModalOpen(true);
  };

  const handleSaveContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.title.trim()) {
      showToast('Vui lòng nhập tiêu đề cuộc thi!', 'error');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      showToast('Vui lòng thiết lập thời gian bắt đầu và kết thúc cuộc thi!', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      if (selectedContestId) {
        await contestApi.updateContest(selectedContestId, formData);
        showToast('Cập nhật thông tin cuộc thi thành công!', 'success');
      } else {
        await contestApi.createContest(formData);
        showToast('Tạo cuộc thi mới thành công!', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Lỗi khi lưu thông tin cuộc thi!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContest = async (id: string | undefined, title: string) => {
    if (!id) {
      showToast('Không xác định được ID cuộc thi để xóa!', 'error');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cuộc thi '${title}' không?`)) return;
    try {
      await contestApi.deleteContest(id);
      showToast(`Đã xóa thành công cuộc thi '${title}'`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Xóa cuộc thi thất bại!', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-2 animate-bounce ${
            toast.type === 'error'
              ? 'bg-red-600 text-white border-red-500'
              : 'bg-emerald-600 text-white border-emerald-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Main Bar: Contest List Title & Create New Button */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight">
            🏆 Danh Sách Cuộc Thi Đã Tạo ({contests.length})
          </h2>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 text-xs font-black rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-sm border-none flex items-center gap-1.5"
        >
          ➕ Tạo Cuộc Thi Mới
        </button>
      </div>

      {/* Contests Cards Grid */}
      {loading ? (
        <div className="text-center py-12 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
          <p className="text-xs text-[var(--text-muted)] font-semibold">Đang nạp danh sách cuộc thi...</p>
        </div>
      ) : contests.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
          <p className="text-xs text-[var(--text-muted)] italic">Chưa có cuộc thi nào. Hãy bấm "Tạo Cuộc Thi Mới" để tạo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.map((c) => (
            <div
              key={c._id || c.slug}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
                    ⏱️ {c.durationMinutes || 90} Phút
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      c.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {c.status === 'published' ? '🟢 Published' : '🟡 Draft'}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-[var(--text-main)] tracking-tight line-clamp-2">
                  {c.title}
                </h3>

                <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                  {c.description || 'Chưa có mô tả chi tiết.'}
                </p>

                <div className="pt-2 text-[11px] text-[var(--text-muted)] space-y-1 font-mono border-t border-[var(--border-color)]">
                  <div>📅 Khai mạc: {new Date(c.startTime).toLocaleString('vi-VN')}</div>
                  <div>🏁 Kết thúc: {new Date(c.endTime).toLocaleString('vi-VN')}</div>
                  <div>📚 Đề thi: {c.problems?.length || 0} bài tập thành phần</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(c)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all border-none cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  ✏️ Sửa
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteContest(c._id || c.slug, c.title)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-200 dark:border-red-900 cursor-pointer flex items-center gap-1"
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Contest Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
                  {selectedContestId ? '✏️ CHỈNH SỬA CUỘC THI' : '➕ TẠO CUỘC THI MỚI'}
                </span>
                <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight mt-1">
                  {selectedContestId ? formData.title || 'Chỉnh sửa cuộc thi' : 'Thiết Kế Đề Thi Cuộc Thi Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold bg-transparent border-none cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveContest} className="space-y-5">
              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-[var(--text-main)] uppercase tracking-wider mb-1">
                    Tiêu đề cuộc thi *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Nhập tiêu đề cuộc thi..."
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[var(--text-main)] uppercase tracking-wider mb-1">
                    Mô tả cuộc thi
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Nhập mô tả nội dung cuộc thi, thể lệ..."
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-[var(--text-main)] uppercase tracking-wider">
                  ⚡ Chọn nhanh thời lượng cuộc thi:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {[30, 60, 90, 120, 1440].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleApplyPresetDuration(mins)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        formData.durationMinutes === mins
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-color)] hover:border-indigo-400'
                      }`}
                    >
                      {mins === 1440 ? '📅 24 Giờ' : `⏱️ ${mins} Phút`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[var(--text-main)] uppercase tracking-wider mb-1">
                    📅 Thời gian Bắt đầu (Start Time) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-sm font-mono text-[var(--text-main)] focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[var(--text-main)] uppercase tracking-wider mb-1">
                    🏁 Thời gian Kết thúc (End Time) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endTime || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-sm font-mono text-[var(--text-main)] focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Duration Minutes */}
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-main)] uppercase tracking-wider mb-1">
                  ⏱️ Thời lượng làm bài cá nhân (Duration Minutes) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={14400}
                    required
                    value={formData.durationMinutes || 90}
                    onChange={(e) => setFormData((prev) => ({ ...prev, durationMinutes: parseInt(e.target.value) || 90 }))}
                    className="w-36 px-4 py-2.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <span className="text-xs text-[var(--text-muted)]">
                    phút đếm ngược cá nhân khi học viên bấm <em>Vào Thi</em>.
                  </span>
                </div>
              </div>

              {/* Status Switcher */}
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-main)] uppercase tracking-wider mb-2">
                  Trạng thái xuất bản cuộc thi:
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, status: 'published' }))}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold border cursor-pointer transition-all ${
                      formData.status === 'published'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-color)]'
                    }`}
                  >
                    🟢 Published (Công khai)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, status: 'draft' }))}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold border cursor-pointer transition-all ${
                      formData.status === 'draft'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-color)]'
                    }`}
                  >
                    🟡 Draft (Bản nháp)
                  </button>
                </div>
              </div>

              {/* Problem Selection */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-[var(--text-main)] uppercase tracking-wider">
                    📚 Chọn bài tập thành phần ({formData.problems?.length || 0} bài đã chọn)
                  </label>
                  <span className="text-xs text-[var(--text-muted)]">Tích chọn bài nạp vào cuộc thi</span>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {lessons.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] italic">Chưa có bài tập nào trong thư viện.</p>
                  ) : (
                    lessons.map((lesson) => {
                      const isSelected = (formData.problems || []).some(
                        (p) => p.lessonId === lesson._id || p.slug === lesson.slug,
                      );

                      return (
                        <div
                          key={lesson._id || lesson.slug}
                          onClick={() => handleToggleProblem(lesson)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200'
                              : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-main)] hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div>
                              <span className="font-bold text-xs block">{lesson.title}</span>
                              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                                [{lesson.type.toUpperCase()}] • {lesson.points || 10} điểm
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-semibold">
                            {isSelected ? '✅ Đã chọn' : '➕ Chọn'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs font-black rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md border-none cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? '⌛ Đang lưu...' : selectedContestId ? '💾 Cập Nhật Cuộc Thi' : '🚀 Lưu Cuộc Thi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

