import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { LessonAuthoring, TestCase, QuizQuestion, QuizOption } from '../types/authoring';
import { authoringApi } from '../axios/authoringApi';

const DEFAULT_LESSON: LessonAuthoring = {
  title: 'Bài tập Python: Tính diện tích hình chữ nhật',
  slug: 'tinh-dien-tich-hcn',
  description: 'Bài tập rèn luyện nhập dữ liệu từ bàn phím và phép nhân toán học cơ bản trong Python.',
  type: 'coding',
  status: 'draft',
  difficulty: 'EASY',
  points: 10,
  learningOutcome: 'Hiểu cách sử dụng hàm int(input()) và thực hiện phép toán nhân hai số nguyên trong Python.',
  content: 'Viết chương trình nhập vào 2 số nguyên a và b lần lượt là chiều dài và chiều rộng của hình chữ nhật. Tính và in ra diện tích hình chữ nhật.',
  starterCode: '# Nhập chiều dài a và chiều rộng b\na = int(input())\nb = int(input())\n\n# Tính diện tích và in ra màn hình\n',
  solutionCode: 'a = int(input())\nb = int(input())\nprint(a * b)',
  testCases: [
    { input: '4\n5', expectedOutput: '20', isHidden: false },
    { input: '10\n20', expectedOutput: '200', isHidden: true },
  ],
  quizQuestions: [],
  hints: {
    hint1: 'Khái niệm & Tư duy: Sử dụng hàm int(input()) để nhận lần lượt 2 số nguyên a (chiều dài) và b (chiều rộng) từ bàn phím.',
    hint2: 'Chiến lược thuật toán:\nBước 1: Nhập chiều dài a = int(input())\nBước 2: Nhập chiều rộng b = int(input())\nBước 3: In kết quả diện tích bằng print(a * b)',
    hint3: 'a = int(input())\nb = int(input())\nprint(a * b)',
  },
};

interface TeacherAuthoringPageProps {
  onLessonSaved?: (lesson: LessonAuthoring) => void;
  onLessonDeleted?: (lessonId: string) => void;
}

export const TeacherAuthoringPage: React.FC<TeacherAuthoringPageProps> = ({
  onLessonSaved,
  onLessonDeleted,
}) => {
  const [formData, setFormData] = useState<LessonAuthoring>(DEFAULT_LESSON);
  const [existingLessons, setExistingLessons] = useState<LessonAuthoring[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [typeFilter, setTypeFilter] = useState<'all' | 'coding' | 'quiz'>('coding');

  const filteredLessonsBySelectedType = useMemo(() => {
    if (typeFilter === 'all') return existingLessons;
    return existingLessons.filter((l) => l.type === typeFilter);
  }, [existingLessons, typeFilter]);

  const codingCount = existingLessons.filter((l) => l.type === 'coding').length;
  const quizCount = existingLessons.filter((l) => l.type === 'quiz').length;

  // Fetch list of existing lessons created by teacher
  const loadExistingLessons = useCallback(async () => {
    try {
      const list = await authoringApi.getLessons();
      if (Array.isArray(list)) {
        setExistingLessons(list);
      }
    } catch {
      const local = localStorage.getItem('app_teacher_saved_lessons');
      if (local) {
        try {
          setExistingLessons(JSON.parse(local));
        } catch (e) {
          /* ignore */
        }
      }
    }
  }, []);

  useEffect(() => {
    loadExistingLessons();
  }, [loadExistingLessons]);

  const handleSelectLessonToEdit = (lesson: LessonAuthoring) => {
    const isQuiz = lesson.type === 'quiz';
    setTypeFilter(isQuiz ? 'quiz' : 'coding');
    setFormData({
      ...DEFAULT_LESSON,
      ...lesson,
      type: isQuiz ? 'quiz' : 'coding',
      content: isQuiz ? '' : lesson.content || '',
      starterCode: isQuiz ? '' : lesson.starterCode || '',
      solutionCode: isQuiz ? '' : lesson.solutionCode || '',
      testCases: isQuiz ? [] : lesson.testCases || [],
      hints: isQuiz
        ? { hint1: '', hint2: '', hint3: '' }
        : lesson.hints || { hint1: '', hint2: '', hint3: lesson.solutionCode || '' },
      quizQuestions: isQuiz ? lesson.quizQuestions || [] : [],
    });
    showToast(`✏️ Đã nạp bài ${isQuiz ? 'Trắc nghiệm' : 'Lập trình'} "${lesson.title}" vào Form để chỉnh sửa!`);
  };

  // Handle Creating New Blank Lesson
  const handleCreateNewBlank = () => {
    const timestamp = Date.now().toString().slice(-4);
    setFormData({
      ...DEFAULT_LESSON,
      _id: undefined,
      title: `Bài tập mới #${timestamp}`,
      slug: `bai-tap-moi-${timestamp}`,
      status: 'draft',
      testCases: [{ input: '', expectedOutput: '', isHidden: false }],
      quizQuestions: [],
      hints: { hint1: '', hint2: '', hint3: '' },
    });
    showToast('➕ Đã tạo Form bài tập mới!');
  };

  // Handle Delete Lesson
  const handleDeleteLesson = async (lessonId?: string, title?: string) => {
    const targetId = lessonId || formData._id;
    const targetTitle = title || formData.title;

    if (!targetId) {
      showToast('Bài tập này chưa được lưu trong cơ sở dữ liệu!', 'error');
      return;
    }

    if (!window.confirm(`⚠️ Bạn có chắc chắn muốn xóa bài học "${targetTitle}"?`)) {
      return;
    }

    try {
      await authoringApi.deleteLesson(targetId);
      showToast(`🗑️ Đã xóa bài học "${targetTitle}" thành công!`);
    } catch {
      showToast(`🗑️ Đã xóa bài học (Lưu cục bộ)!`);
    }

    setExistingLessons((prev) => prev.filter((l) => l._id !== targetId && l.slug !== targetId));
    if (onLessonDeleted) onLessonDeleted(targetId);

    if (formData._id === targetId) {
      handleCreateNewBlank();
    }
  };

  // Schema Validation Checkers
  const isOutcomeValid = formData.learningOutcome.trim().length > 0;
  const isTestValid =
    formData.type === 'coding'
      ? formData.testCases.length > 0 &&
        formData.testCases.some((tc) => tc.input.trim() !== '' && tc.expectedOutput.trim() !== '')
      : formData.quizQuestions.length > 0 &&
        formData.quizQuestions.every((q) => q.options && q.options.some((opt) => opt.isCorrect));

  const canPublish = isOutcomeValid && isTestValid;

  // Handler for form field updates
  const handleChange = (field: keyof LessonAuthoring, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Auto generate slug from title
  const handleTitleChange = (newTitle: string) => {
    const generatedSlug = newTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    setFormData((prev) => ({
      ...prev,
      title: newTitle,
      slug: generatedSlug,
    }));
  };

  // TestCase management
  const handleAddTestCase = () => {
    const newTC: TestCase = { input: '', expectedOutput: '', isHidden: false };
    setFormData((prev) => ({ ...prev, testCases: [...prev.testCases, newTC] }));
  };

  const handleUpdateTestCase = (index: number, field: keyof TestCase, value: any) => {
    const updated = [...formData.testCases];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, testCases: updated }));
  };

  const handleRemoveTestCase = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }));
  };

  // Quiz Question management
  const handleAddQuizQuestion = () => {
    const newQ: QuizQuestion = {
      content: '',
      options: [
        { key: 'A', text: '', isCorrect: true },
        { key: 'B', text: '', isCorrect: false },
      ],
      explanation: '',
      points: 10,
    };
    setFormData((prev) => ({ ...prev, quizQuestions: [...prev.quizQuestions, newQ] }));
  };

  const handleUpdateQuizQuestion = (qIndex: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...formData.quizQuestions];
    updated[qIndex] = { ...updated[qIndex], [field]: value };
    setFormData((prev) => ({ ...prev, quizQuestions: updated }));
  };

  const handleUpdateQuizOption = (qIndex: number, optIndex: number, field: keyof QuizOption, value: any) => {
    const updatedQs = [...formData.quizQuestions];
    const updatedOpts = [...updatedQs[qIndex].options];

    if (field === 'isCorrect' && value === true) {
      updatedOpts.forEach((o, i) => {
        o.isCorrect = i === optIndex;
      });
    } else {
      updatedOpts[optIndex] = { ...updatedOpts[optIndex], [field]: value };
    }

    updatedQs[qIndex].options = updatedOpts;
    setFormData((prev) => ({ ...prev, quizQuestions: updatedQs }));
  };

  const handleAddOptionToQuestion = (qIndex: number) => {
    const updatedQs = [...formData.quizQuestions];
    const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
    const nextKey = keys[updatedQs[qIndex].options.length] || `OPT${updatedQs[qIndex].options.length + 1}`;

    updatedQs[qIndex].options.push({ key: nextKey, text: '', isCorrect: false });
    setFormData((prev) => ({ ...prev, quizQuestions: updatedQs }));
  };

  const handleRemoveQuizQuestion = (qIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.filter((_, i) => i !== qIndex),
    }));
  };

  // Save / Publish submit handler
  const handleSubmit = async (targetStatus: 'draft' | 'published') => {
    if (targetStatus === 'published' && !canPublish) {
      showToast('Khóa nút Publish: Vui lòng điền đủ Chuẩn đầu ra và Bài test!', 'error');
      return;
    }

    setIsSubmitting(true);
    const isQuiz = formData.type === 'quiz';
    const payload: Partial<LessonAuthoring> = {
      ...formData,
      status: targetStatus,
      content: isQuiz ? '' : formData.content || '',
      starterCode: isQuiz ? '' : formData.starterCode || '',
      solutionCode: isQuiz ? '' : formData.solutionCode || '',
      testCases: isQuiz ? [] : formData.testCases || [],
      hints: isQuiz ? { hint1: '', hint2: '', hint3: '' } : formData.hints,
      quizQuestions: isQuiz ? formData.quizQuestions || [] : [],
    };

    try {
      let result: LessonAuthoring;
      if (formData._id) {
        result = await authoringApi.updateLesson(formData._id, payload);
      } else {
        result = await authoringApi.createLesson(payload);
      }
      setFormData(result);
      setExistingLessons((prev) => {
        const exists = prev.some((l) => l._id === result._id || l.slug === result.slug);
        return exists
          ? prev.map((l) => (l._id === result._id || l.slug === result.slug ? result : l))
          : [result, ...prev];
      });
      if (onLessonSaved) onLessonSaved(result);
      showToast(
        targetStatus === 'published'
          ? '🎉 Đã xuất bản bài học thành công lên MongoDB!'
          : '💾 Đã lưu bản nháp bài học thành công!',
      );
    } catch (err: any) {
      console.warn('API save fallback to local state:', err);
      const localResult: LessonAuthoring = {
        ...payload,
        status: targetStatus,
        _id: formData._id || `local-${Date.now()}`,
      } as LessonAuthoring;
      setFormData(localResult);
      setExistingLessons((prev) => [...prev.filter((l) => l._id !== localResult._id), localResult]);
      if (onLessonSaved) onLessonSaved(localResult);
      showToast(
        targetStatus === 'published'
          ? '🎉 Đã xuất bản bài học (Lưu cục bộ)!'
          : '💾 Đã lưu bản nháp bài học thành công (Lưu cục bộ)!',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export JSON file (Strictly separated per lesson type)
  const handleExportJson = () => {
    const isCoding = formData.type === 'coding';
    const isQuiz = formData.type === 'quiz';

    const cleanedLessonData: any = {
      title: formData.title,
      slug: formData.slug,
      description: formData.description || '',
      type: formData.type,
      status: formData.status,
      learningOutcome: formData.learningOutcome || '',
      difficulty: formData.difficulty,
      points: formData.points,
    };

    if (isCoding) {
      cleanedLessonData.content = formData.content || '';
      cleanedLessonData.starterCode = formData.starterCode || '';
      cleanedLessonData.solutionCode = formData.solutionCode || '';
      cleanedLessonData.testCases = formData.testCases || [];
      cleanedLessonData.hints = formData.hints || { hint1: '', hint2: '', hint3: '' };
    } else if (isQuiz) {
      cleanedLessonData.quizQuestions = formData.quizQuestions || [];
    }

    const packageData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      lessonData: cleanedLessonData,
    };
    const jsonString = JSON.stringify(packageData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-${formData.type}-${formData.slug || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`📤 Đã xuất file JSON riêng biệt cho bài ${isCoding ? 'Lập trình' : 'Trắc nghiệm'}!`);
  };

  // Import JSON file (Strictly separated per lesson type)
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedData = parsed.lessonData || parsed;

        if (!importedData.title || !importedData.type) {
          throw new Error('Dữ liệu JSON không hợp lệ: Thiếu trường bắt buộc (title, type).');
        }

        const isQuiz = importedData.type === 'quiz';

        const cleanData: LessonAuthoring = {
          ...DEFAULT_LESSON,
          title: importedData.title,
          slug: importedData.slug || `bai-tap-${Date.now()}`,
          type: isQuiz ? 'quiz' : 'coding',
          status: importedData.status || 'draft',
          difficulty: importedData.difficulty || 'EASY',
          points: importedData.points || 10,
          description: importedData.description || '',
          learningOutcome: importedData.learningOutcome || '',
          // Strictly separate fields by type
          content: isQuiz ? '' : importedData.content || '',
          starterCode: isQuiz ? '' : importedData.starterCode || '',
          solutionCode: isQuiz ? '' : importedData.solutionCode || '',
          testCases: isQuiz ? [] : importedData.testCases || [],
          hints: isQuiz
            ? { hint1: '', hint2: '', hint3: '' }
            : importedData.hints || { hint1: '', hint2: '', hint3: '' },
          quizQuestions: isQuiz ? importedData.quizQuestions || [] : [],
        };

        setFormData(cleanData);
        showToast(`📥 Đã nạp gói dữ liệu JSON bài ${isQuiz ? 'Trắc nghiệm' : 'Lập trình'} riêng biệt!`);
      } catch (err: any) {
        showToast(`❌ Lỗi đọc file JSON: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-2 animate-bounce ${
            toastMessage.type === 'error'
              ? 'bg-red-600 text-white border-red-500'
              : 'bg-emerald-600 text-white border-emerald-500'
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              👨‍🏫 Teacher Authoring Tool v0
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                formData.status === 'published'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Trạng thái: {formData.status === 'published' ? '🟢 Published' : '🟡 Draft (Nháp)'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">
            Quản trị & Thiết kế Nội dung Bài học
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Tạo hoặc chỉnh sửa bài học trắc nghiệm/lập trình, thiết lập chuẩn đầu ra và 3 tầng gợi ý.
          </p>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCreateNewBlank}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-xs flex items-center gap-1.5 border-none"
          >
            ➕ Bài tập mới
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJson}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            title="Import cấu hình bài học từ file JSON"
          >
            📥 Import
          </button>
          <button
            onClick={handleExportJson}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            title="Xuất gói dữ liệu JSON bài học"
          >
            📤 Export
          </button>
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-indigo-500/30 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            title="Xem giao diện hiển thị cho Học viên"
          >
            👁️ Preview
          </button>
        </div>
      </div>

      {/* Lesson Selector & Management Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              📂 Bước 1: Chọn loại bài học trước:
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => {
                setTypeFilter('coding');
                setFormData((prev) => ({
                  ...prev,
                  type: 'coding',
                  quizQuestions: [],
                }));
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'coding'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              🧑‍💻 Bài Lập trình ({codingCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('quiz');
                setFormData((prev) => ({
                  ...prev,
                  type: 'quiz',
                  content: '',
                  starterCode: '',
                  solutionCode: '',
                  testCases: [],
                  hints: { hint1: '', hint2: '', hint3: '' },
                }));
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'quiz'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              📝 Bài Trắc nghiệm ({quizCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Tất cả ({existingLessons.length})
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
            📋 Bước 2: Chọn bài học để chỉnh sửa / xóa:
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={formData._id || formData.slug || ''}
              onChange={(e) => {
                if (e.target.value === '__NEW__') {
                  handleCreateNewBlank();
                  return;
                }
                const selected = existingLessons.find(
                  (l) => l._id === e.target.value || l.slug === e.target.value,
                );
                if (selected) handleSelectLessonToEdit(selected);
              }}
              className="flex-1 sm:w-80 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="" disabled>
                -- Danh sách bài {typeFilter === 'coding' ? 'Lập trình' : typeFilter === 'quiz' ? 'Trắc nghiệm' : 'tất cả'} ({filteredLessonsBySelectedType.length} bài) --
              </option>
              <option value="__NEW__">Tạo bài học mới</option>
              {filteredLessonsBySelectedType.map((l) => (
                <option key={l._id || l.slug} value={l._id || l.slug}>
                  [{l.type === 'coding' ? 'Coding' : 'Quiz'}] {l.title.replace(/^[🧑‍💻📝👨‍🏫\s]+/, '').trim()} (
                  {l.status === 'published' ? 'Published' : 'Draft'})
                </option>
              ))}
            </select>

            {formData._id && (
              <button
                type="button"
                onClick={() => handleDeleteLesson()}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all border-none cursor-pointer shadow-xs"
                title="Xóa bài học đang chọn"
              >
                🗑️ Xóa bài này
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Schema Validation Banner */}
      <div
        className={`border rounded-2xl p-4 transition-all ${
          canPublish
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
        }`}
      >
        <div className="flex items-center justify-between font-bold text-sm mb-1.5">
          <span className="flex items-center gap-2">
            {canPublish ? '✅ Chuẩn đầu ra & Bài test ĐẠT YÊU CẦU' : '⚠️ CHƯA ĐỦ ĐIỀU KIỆN XUẤT BẢN (PUBLISH)'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-black/10">Validation Guard</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            {isOutcomeValid ? '✅' : '❌'}
            <span>
              <strong>Chuẩn đầu ra (learningOutcome):</strong>{' '}
              {isOutcomeValid ? 'Đã nhập chuẩn đầu ra bài học' : 'Bắt buộc nhập để xuất bản bài học'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isTestValid ? '✅' : '❌'}
            <span>
              <strong>Bộ bài test ({formData.type === 'coding' ? 'TestCases' : 'Quiz Questions'}):</strong>{' '}
              {isTestValid
                ? formData.type === 'coding'
                  ? `Đã có ${formData.testCases.length} test case`
                  : `Đã có ${formData.quizQuestions.length} câu hỏi hợp lệ`
                : formData.type === 'coding'
                ? 'Yêu cầu ít nhất 1 Test Case (input & expectedOutput)'
                : 'Yêu cầu ít nhất 1 Câu hỏi Quiz có đáp án đúng'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Authoring Form */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm space-y-6">
        {/* Section 1: Basic Information */}
        <div>
          <h2 className="text-base font-bold text-[var(--text-main)] mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            📌 Phần 1: Thông tin cơ bản bài học
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Tiêu đề bài học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                placeholder="Nhập tiêu đề bài học..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Slug đường dẫn (Auto)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Loại bài học
              </label>
              <div className="w-full px-3.5 py-2 text-xs font-extrabold rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                <span>
                  {formData.type === 'coding' ? '🧑‍💻 Bài Lập trình (Coding)' : '📝 Bài Trắc nghiệm (Quiz)'}
                </span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)] italic">
                  (Đã chọn theo Bước 1)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">Độ khó</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                >
                  <option value="EASY">🟢 Dễ (EASY)</option>
                  <option value="MEDIUM">🟡 Trung bình (MEDIUM)</option>
                  <option value="HARD">🔴 Khó (HARD)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">Điểm thưởng</label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => handleChange('points', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">Mô tả tóm tắt</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                placeholder="Mô tả mục đích bài học..."
              />
            </div>
          </div>
        </div>

        {/* Section 2: Learning Outcome */}
        <div>
          <h2 className="text-base font-bold text-[var(--text-main)] mb-2 flex items-center justify-between border-b border-[var(--border-color)] pb-2">
            <span>🎯 Phần 2: Chuẩn đầu ra bài học (Learning Outcome)</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                isOutcomeValid
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
              }`}
            >
              {isOutcomeValid ? '✅ Đã điền' : '❌ Bắt buộc để Publish'}
            </span>
          </h2>
          <textarea
            rows={3}
            value={formData.learningOutcome}
            onChange={(e) => handleChange('learningOutcome', e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500 font-sans"
            placeholder="Ví dụ: Học viên nắm vững cách dùng int(input()) và phép nhân toán học cơ bản trong Python..."
          />
        </div>

        {/* Section 3: Content & Tests (Conditional Coding / Quiz) */}
        {formData.type === 'coding' ? (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-[var(--text-main)] border-b border-[var(--border-color)] pb-2 flex items-center justify-between">
              <span>💻 Phần 3: Nội dung Lập trình & Test Cases</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  isTestValid
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}
              >
                {isTestValid ? `✅ ${formData.testCases.length} Test Cases` : '❌ Cần ít nhất 1 Test Case'}
              </span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Nội dung lý thuyết & Đề bài bài tập
              </label>
              <textarea
                rows={4}
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500 font-sans"
                placeholder="Nhập đề bài chi tiết..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Mã nguồn khởi tạo cho Học viên (Starter Code)
                </label>
                <textarea
                  rows={6}
                  value={formData.starterCode}
                  onChange={(e) => handleChange('starterCode', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Mã nguồn Lời giải chuẩn mẫu (Solution Code)
                </label>
                <textarea
                  rows={6}
                  value={formData.solutionCode}
                  onChange={(e) => handleChange('solutionCode', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* TestCases List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase text-[var(--text-muted)] tracking-wider">
                  Danh sách Bài kiểm tra (Test Cases)
                </h3>
                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer border-none shadow-xs"
                >
                  ➕ Thêm TestCase
                </button>
              </div>

              <div className="space-y-3">
                {formData.testCases.map((tc, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] flex flex-col md:flex-row gap-3 items-start md:items-center"
                  >
                    <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      #{index + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                      <div>
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] block">Input (Đầu vào)</span>
                        <input
                          type="text"
                          value={tc.input}
                          onChange={(e) => handleUpdateTestCase(index, 'input', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)]"
                          placeholder="Ví dụ: 4\n5"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] block">Expected Output (Kết quả mong đợi)</span>
                        <input
                          type="text"
                          value={tc.expectedOutput}
                          onChange={(e) => handleUpdateTestCase(index, 'expectedOutput', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)]"
                          placeholder="Ví dụ: 20"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tc.isHidden}
                          onChange={(e) => handleUpdateTestCase(index, 'isHidden', e.target.checked)}
                          className="rounded border-[var(--border-color)]"
                        />
                        <span className="text-[11px] text-[var(--text-muted)]">Ẩn test case</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveTestCase(index)}
                        className="px-2.5 py-1 text-xs text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all border border-red-300 dark:border-red-800 cursor-pointer"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: 3-Tier Hint Engine Setup */}
            <div className="pt-4 border-t border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                  <span>💡 Phần 4: Thiết lập 3 Tầng Gợi Ý (Hint Engine)</span>
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  3 Tầng Hỗ Trợ Học Viên
                </span>
              </div>

              <div className="space-y-4">
                {/* Tier 1 */}
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      💡 Tầng 1: Khái niệm & Định hướng tư duy (Concept & Mindset)
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)] font-semibold">
                      Chỉ chứa khái niệm, tuyệt đối KHÔNG chứa code hoàn chỉnh
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.hints?.hint1 || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        hints: { ...prev.hints, hint1: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                    placeholder="Ví dụ: Định hướng cách dùng int(input()) đọc dữ liệu..."
                  />
                </div>

                {/* Tier 2 */}
                <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/40 dark:bg-sky-950/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-sky-700 dark:text-sky-300">
                      🎯 Tầng 2: Chiến lược thuật toán (Algorithm Strategy)
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)] font-semibold">
                      Các bước tiến hành giải bài toán (Pseudocode / Các bước logic)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.hints?.hint2 || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        hints: { ...prev.hints, hint2: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                    placeholder="Ví dụ: Bước 1: Nhập a. Bước 2: Nhập b. Bước 3: Tính a * b..."
                  />
                </div>

                {/* Tier 3 */}
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      💻 Tầng 3: Code Mẫu Lời Giải Hoàn Chỉnh (Python Solution Code)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          hints: { ...prev.hints, hint3: prev.solutionCode || '' },
                        }))
                      }
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-all border-none cursor-pointer"
                    >
                      📋 Nạp từ Solution Code
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.hints?.hint3 || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        hints: { ...prev.hints, hint3: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                    placeholder="a = int(input())\nb = int(input())\nprint(a * b)"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Quiz Section */
          <div className="space-y-6">
            <h2 className="text-base font-bold text-[var(--text-main)] border-b border-[var(--border-color)] pb-2 flex items-center justify-between">
              <span>📝 Phần 3: Nội dung Bài Trắc Nghiệm (Quiz Questions)</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  isTestValid
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}
              >
                {isTestValid ? `✅ ${formData.quizQuestions.length} Câu hỏi Quiz` : '❌ Cần ít nhất 1 câu hỏi có đáp án'}
              </span>
            </h2>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddQuizQuestion}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer border-none shadow-xs"
              >
                ➕ Thêm câu hỏi trắc nghiệm
              </button>
            </div>

            <div className="space-y-6">
              {formData.quizQuestions.map((q, qIndex) => (
                <div
                  key={qIndex}
                  className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-600 text-white">
                      Câu hỏi #{qIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuizQuestion(qIndex)}
                      className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-600 hover:text-white rounded-lg border border-red-300 dark:border-red-800 cursor-pointer"
                    >
                      🗑️ Xóa câu hỏi
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">Nội dung câu hỏi</label>
                    <input
                      type="text"
                      value={q.content}
                      onChange={(e) => handleUpdateQuizQuestion(qIndex, 'content', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)]"
                      placeholder="Nhập nội dung câu hỏi trắc nghiệm..."
                    />
                  </div>

                  {/* Options List */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase block">
                      Danh sách Lựa chọn & Đáp án đúng
                    </span>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <span className="w-6 text-center text-xs font-bold text-indigo-600 dark:text-cyan-400">
                          {opt.key}.
                        </span>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleUpdateQuizOption(qIndex, optIndex, 'text', e.target.value)}
                          className="flex-1 px-3 py-1 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)]"
                          placeholder={`Nội dung lựa chọn ${opt.key}...`}
                        />
                        <label className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 cursor-pointer">
                          <input
                            type="radio"
                            name={`correct-q-${qIndex}`}
                            checked={opt.isCorrect}
                            onChange={(e) => handleUpdateQuizOption(qIndex, optIndex, 'isCorrect', e.target.checked)}
                          />
                          <span>Đáp án đúng</span>
                        </label>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddOptionToQuestion(qIndex)}
                      className="text-[11px] text-indigo-600 dark:text-cyan-400 font-semibold hover:underline bg-transparent border-none cursor-pointer pt-1"
                    >
                      + Thêm lựa chọn mới
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">Giải thích đáp án</label>
                    <textarea
                      rows={2}
                      value={q.explanation || ''}
                      onChange={(e) => handleUpdateQuizQuestion(qIndex, 'explanation', e.target.value)}
                      className="w-full px-3 py-1 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)]"
                      placeholder="Giải thích chi tiết vì sao đáp án đúng..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Action Footer */}
        <div className="pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
            {canPublish ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                ✅ Bài học đủ chuẩn để xuất bản công khai.
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                ⚠️ Cần nhập Chuẩn đầu ra và ít nhất 1 Bài test để mở nút Publish.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Delete button if editing existing lesson */}
            {formData._id && (
              <button
                type="button"
                onClick={() => handleDeleteLesson()}
                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all border-none cursor-pointer shadow-xs"
              >
                🗑️ Xóa bài học
              </button>
            )}

            {/* Save Draft */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('draft')}
              className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            >
              💾 Lưu bản nháp (Draft)
            </button>

            {/* Publish Button with Guard */}
            <button
              type="button"
              disabled={isSubmitting || !canPublish}
              onClick={() => handleSubmit('published')}
              className={`flex-1 sm:flex-initial px-6 py-2.5 text-xs font-extrabold rounded-xl transition-all border-none shadow-md flex items-center justify-center gap-2 ${
                canPublish
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
              title={canPublish ? 'Xuất bản bài học' : 'Vui lòng bổ sung Chuẩn đầu ra và Bài test để xuất bản'}
            >
              🚀 Xuất bản bài học (Publish)
            </button>
          </div>
        </div>
      </div>

      {/* Section 6: Preview Learner View Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 uppercase">
                  👁️ Live Learner Preview
                </span>
                <h3 className="text-lg font-black text-[var(--text-main)] mt-1">{formData.title}</h3>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-main)] rounded-lg cursor-pointer border border-[var(--border-color)]"
              >
                ✕ Đóng xem trước
              </button>
            </div>

            {/* Learning Outcome Box */}
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
              <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-1">
                🎯 Chuẩn đầu ra học viên sẽ đạt được:
              </span>
              <p className="text-[var(--text-main)]">{formData.learningOutcome || 'Chưa cập nhật'}</p>
            </div>

            {/* Content Preview */}
            {formData.type === 'coding' ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Nội dung đề bài:</h4>
                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] whitespace-pre-wrap">
                    {formData.content}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Giao diện Khung viết Code (Starter Code):</h4>
                  <pre className="p-3 rounded-xl bg-slate-900 text-cyan-300 text-xs font-mono overflow-x-auto">
                    {formData.starterCode}
                  </pre>
                </div>

                {/* 3 Hints Preview */}
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1">3 Tầng Gợi ý (Hint Engine):</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs">
                      <strong className="text-amber-800 dark:text-amber-300 block mb-1">Tầng 1: Khái niệm</strong>
                      <p className="text-[var(--text-main)] text-[11px]">{formData.hints?.hint1 || 'Chưa có'}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-xs">
                      <strong className="text-sky-800 dark:text-sky-300 block mb-1">Tầng 2: Chiến lược</strong>
                      <p className="text-[var(--text-main)] text-[11px] whitespace-pre-wrap">{formData.hints?.hint2 || 'Chưa có'}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs">
                      <strong className="text-emerald-800 dark:text-emerald-300 block mb-1">Tầng 3: Code mẫu</strong>
                      <pre className="text-[var(--text-main)] text-[10px] font-mono whitespace-pre-wrap">{formData.hints?.hint3 || 'Chưa có'}</pre>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Test Cases công khai:</h4>
                  <div className="space-y-1.5">
                    {formData.testCases
                      .filter((tc) => !tc.isHidden)
                      .map((tc, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-mono flex justify-between">
                          <span>Input: {tc.input}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Expected: {tc.expectedOutput}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Xem trước bài làm trắc nghiệm:</h4>
                {formData.quizQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                    <p className="text-xs font-bold text-[var(--text-main)]">
                      Câu {idx + 1}: {q.content}
                    </p>
                    <div className="space-y-1">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                            opt.isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                              : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)]'
                          }`}
                        >
                          <span>{opt.key}. {opt.text}</span>
                          {opt.isCorrect && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded">Đáp án đúng</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
