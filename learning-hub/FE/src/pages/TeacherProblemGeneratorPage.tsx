import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Plus,
  Trash2,
  Save,
  RotateCw,
  Pencil,
} from 'lucide-react';
import problemGeneratorApi from '../axios/problemGeneratorApi';
import type {
  GenerateProblemErrorItem,
  GenerateProblemResultItem,
  ProblemLevel,
  ProblemSpecInput,
} from '../types/problemGenerator';

const LEVEL_OPTIONS: { value: ProblemLevel; label: string }[] = [
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'T.Bình' },
  { value: 'HARD', label: 'Khó' },
];

const MAX_SPECS = 10;

function emptySpecForm(): SpecForm {
  return { learningOutcome: '', level: 'EASY', constraintsText: '', tagsText: '' };
}

interface SpecForm {
  learningOutcome: string;
  level: ProblemLevel;
  constraintsText: string;
  tagsText: string;
}

function toSpecInput(form: SpecForm): ProblemSpecInput {
  return {
    learningOutcome: form.learningOutcome.trim(),
    level: form.level,
    constraints: form.constraintsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean),
    tags: form.tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      {copied ? 'Đã sao chép' : 'Sao chép'}
    </button>
  );
}

// State lưu trong FE cho mỗi item để nút "Lưu" cập nhật đúng dòng. `item`
// KHÔNG còn bất biến sau khi sinh — giáo viên có thể tự sửa title/
// description/solutionCode trực tiếp trên UI rồi bấm "Chạy lại test", lúc đó
// cả draft lẫn validation trong item được thay bằng kết quả revalidate mới.
interface ResultItemState {
  item: GenerateProblemResultItem;
  saving: boolean;
  saved: boolean;
  saveError: string | null;
  // Human-in-the-loop: giáo viên tick xác nhận đã đối chiếu cảnh báo trùng
  // lặp MỀM và muốn lưu đè — chỉ có tác dụng khi validation không có
  // hasHardBlockDuplicate (hard block không cho override).
  duplicateOverrideChecked: boolean;
  overrideReason: string;
  // Sửa trực tiếp trên UI: đang mở form sửa, và đang chạy lại test.
  editing: boolean;
  revalidating: boolean;
  revalidateError: string | null;
}

export const TeacherProblemGeneratorPage: React.FC = () => {
  const [specs, setSpecs] = useState<SpecForm[]>([emptySpecForm()]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItemState[] | null>(null);
  // Lỗi từng bài của lần sinh gần nhất (partial success) — giữ lại
  // ProblemSpecInput gốc kèm theo để nút "Thử lại" gửi đúng y hệt spec đó,
  // không bắt giáo viên gõ lại form.
  const [genErrors, setGenErrors] = useState<
    Array<{ error: GenerateProblemErrorItem; spec: ProblemSpecInput }>
  >([]);
  // Index (theo genErrors) đang thử lại — khác null thì TẤT CẢ nút "Thử lại"
  // đều bị disable (không chỉ riêng nút đang chạy) để tránh 2 retry chạy
  // song song cùng sửa `results`; chỉ icon loading là hiển thị riêng cho
  // đúng nút đang chạy (so sánh retryingIndex === index).
  const [retryingIndex, setRetryingIndex] = useState<number | null>(null);
  // Backend sinh tuần tự và KHÔNG stream tiến độ từng bài (một response HTTP
  // duy nhất khi xong cả lô) — đếm số giây đã trôi qua để giáo viên thấy hệ
  // thống vẫn đang chạy trong lúc đợi, thay vì giả vờ biết chính xác đã xong
  // bài thứ mấy (điều backend không có cách nào báo cho FE biết giữa chừng).
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalGenerating, setTotalGenerating] = useState(0);

  const updateSpec = (index: number, patch: Partial<SpecForm>) => {
    setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addSpec = () => {
    if (specs.length >= MAX_SPECS) return;
    setSpecs((prev) => [...prev, emptySpecForm()]);
  };

  const removeSpec = (index: number) => {
    setSpecs((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  // retryingIndex !== null chặn luôn nút Generate chính — nếu không, một
  // retry đang chạy có thể bị ghi đè mất bởi setResults(...) (thay thế toàn
  // bộ mảng) của handleGenerate, trong khi handleRetryOne lại append vào
  // đúng lúc response của nó về, gây race giữa 2 request cùng sửa `results`.
  const canGenerate =
    specs.some((s) => s.learningOutcome.trim()) && !isGenerating && retryingIndex === null;

  // Đếm giây trôi qua trong lúc isGenerating=true — dọn interval khi xong
  // hoặc khi component unmount giữa chừng.
  useEffect(() => {
    if (!isGenerating) return;
    setElapsedSeconds(0);
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!canGenerate) return;

    const validSpecs = specs
      .filter((s) => s.learningOutcome.trim())
      .map(toSpecInput);

    setIsGenerating(true);
    setErrorMsg(null);
    setResults(null);
    setGenErrors([]);
    setTotalGenerating(validSpecs.length);

    try {
      const res = await problemGeneratorApi.generate({ specs: validSpecs });
      setResults(
        (res.results || []).map((item) => ({
          item,
          saving: false,
          saved: false,
          saveError: null,
          duplicateOverrideChecked: false,
          overrideReason: '',
          editing: false,
          revalidating: false,
          revalidateError: null,
        })),
      );
      setGenErrors(
        (res.errors || []).map((error) => ({ error, spec: validSpecs[error.specIndex] })),
      );
    } catch (err: any) {
      // Chỉ còn xảy ra khi cả request thất bại hoàn toàn (mất mạng, backend
      // down) — lỗi của TỪNG bài trong lô đã được backend trả về dưới dạng
      // res.errors (partial success) thay vì ném exception ở đây.
      setErrorMsg(
        err?.response?.data?.message ||
          'Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng và thử lại.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Thử lại MỘT bài bị lỗi bằng đúng spec đã lưu, không phải toàn bộ lô —
  // giữ nguyên các bài đã sinh thành công trong `results`, chỉ thêm bài mới
  // nếu thành công hoặc cập nhật lại lý do lỗi nếu vẫn thất bại.
  const handleRetryOne = async (errorIndex: number) => {
    const target = genErrors[errorIndex];
    if (!target || retryingIndex !== null) return;

    setRetryingIndex(errorIndex);
    try {
      const res = await problemGeneratorApi.generate({ specs: [target.spec] });

      const retryResults = res.results || [];
      const retryErrors = res.errors || [];

      if (retryResults.length > 0) {
        setResults((prev) => [
          ...(prev || []),
          ...retryResults.map((item) => ({
            item,
            saving: false,
            saved: false,
            saveError: null,
            duplicateOverrideChecked: false,
            overrideReason: '',
            editing: false,
            revalidating: false,
            revalidateError: null,
          })),
        ]);
        setGenErrors((prev) => prev.filter((_, i) => i !== errorIndex));
      } else if (retryErrors.length > 0) {
        setGenErrors((prev) =>
          prev.map((g, i) => (i === errorIndex ? { ...g, error: retryErrors[0] } : g)),
        );
      }
    } catch (err: any) {
      setGenErrors((prev) =>
        prev.map((g, i) =>
          i === errorIndex
            ? {
                ...g,
                error: {
                  ...g.error,
                  reason:
                    err?.response?.data?.message || 'Không kết nối được tới máy chủ.',
                },
              }
            : g,
        ),
      );
    } finally {
      setRetryingIndex(null);
    }
  };

  const handleSave = async (index: number) => {
    if (!results) return;
    const target = results[index];
    if (target.saving || target.saved) return;

    const hasSoftDuplicate =
      target.item.validation.duplicateCandidates.length > 0 &&
      !target.item.validation.hasHardBlockDuplicate;

    setResults((prev) =>
      prev!.map((r, i) => (i === index ? { ...r, saving: true, saveError: null } : r)),
    );

    try {
      await problemGeneratorApi.save({
        draft: target.item.draft,
        forceSave: hasSoftDuplicate ? target.duplicateOverrideChecked : undefined,
        overrideReason: hasSoftDuplicate ? target.overrideReason.trim() || undefined : undefined,
      });
      setResults((prev) =>
        prev!.map((r, i) => (i === index ? { ...r, saving: false, saved: true } : r)),
      );
    } catch (err: any) {
      setResults((prev) =>
        prev!.map((r, i) =>
          i === index
            ? {
                ...r,
                saving: false,
                saveError:
                  err?.response?.data?.message || 'Không lưu được bài này. Vui lòng thử lại.',
              }
            : r,
        ),
      );
    }
  };

  // Tick/bỏ tick "Tôi xác nhận bỏ qua cảnh báo trùng lặp" cho MỘT kết quả cụ
  // thể — chỉ ảnh hưởng state cục bộ, không gửi request nào tới khi bấm Lưu.
  const handleToggleOverride = (index: number) => {
    setResults((prev) =>
      prev
        ? prev.map((r, i) =>
            i === index ? { ...r, duplicateOverrideChecked: !r.duplicateOverrideChecked } : r,
          )
        : prev,
    );
  };

  const handleUpdateOverrideReason = (index: number, reason: string) => {
    setResults((prev) =>
      prev ? prev.map((r, i) => (i === index ? { ...r, overrideReason: reason } : r)) : prev,
    );
  };

  // "Yêu cầu AI sinh lại bài khác" — thêm một spec MỚI vào form (không mất
  // spec đang có) gợi ý sẵn learning outcome (lấy tạm từ title của draft vừa
  // sinh — response /generate không giữ lại learningOutcome gốc giáo viên đã
  // gõ) kèm constraint "tránh trùng với [tên bài trùng]", để giáo viên chỉ
  // cần chỉnh lại learning outcome nếu muốn rồi bấm Sinh lại. Chỉ thêm spec,
  // KHÔNG tự động gọi generate — dữ liệu form vẫn hoàn toàn nằm trong tay
  // giáo viên trước khi tốn thêm 1 lượt gọi Gemini.
  const handleRequestRegenerateAvoidingDuplicate = (
    suggestedLearningOutcome: string,
    duplicateTitles: string[],
  ) => {
    if (specs.length >= MAX_SPECS) {
      return;
    }
    const avoidNote = `Tránh trùng lặp với dạng bài: ${duplicateTitles.join(', ')}`;
    setSpecs((prev) => [
      ...prev,
      {
        learningOutcome: suggestedLearningOutcome,
        level: 'EASY',
        constraintsText: avoidNote,
        tagsText: '',
      },
    ]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Bật/tắt form sửa trực tiếp title/description/solutionCode ngay trên
  // card kết quả — thay vì chỉ báo "hãy sinh lại hoặc tự sửa" suông.
  const handleToggleEdit = (index: number) => {
    setResults((prev) =>
      prev
        ? prev.map((r, i) =>
            i === index ? { ...r, editing: !r.editing, revalidateError: null } : r,
          )
        : prev,
    );
  };

  const handleUpdateDraftField = (
    index: number,
    field: 'title' | 'description' | 'solutionCode',
    value: string,
  ) => {
    setResults((prev) =>
      prev
        ? prev.map((r, i) =>
            i === index
              ? { ...r, item: { ...r.item, draft: { ...r.item.draft, [field]: value } } }
              : r,
          )
        : prev,
    );
  };

  // "Chạy lại test" — gọi /revalidate với draft hiện tại (đã sửa trên UI),
  // KHÔNG gọi lại Gemini. Thay cả draft lẫn validation trong item bằng kết
  // quả mới, để mọi phần UI phụ thuộc validation (banner, test list, cảnh
  // báo trùng lặp, nút Lưu) tự cập nhật theo đúng luồng render sẵn có.
  const handleRevalidate = async (index: number) => {
    const target = results?.[index];
    if (!target || target.revalidating) return;

    setResults((prev) =>
      prev
        ? prev.map((r, i) =>
            i === index ? { ...r, revalidating: true, revalidateError: null } : r,
          )
        : prev,
    );

    try {
      const validation = await problemGeneratorApi.revalidate({ draft: target.item.draft });
      setResults((prev) =>
        prev
          ? prev.map((r, i) =>
              i === index
                ? {
                    ...r,
                    item: { ...r.item, validation },
                    revalidating: false,
                    // Sửa nội dung rồi chạy lại test làm thay đổi bộ cảnh báo
                    // trùng lặp cũ — reset override để giáo viên phải tự xem
                    // lại cảnh báo MỚI trước khi tick xác nhận, không giữ lại
                    // xác nhận cho một bộ cảnh báo đã không còn đúng nữa.
                    duplicateOverrideChecked: false,
                    overrideReason: '',
                    editing: false,
                  }
                : r,
            )
          : prev,
      );
    } catch (err: any) {
      setResults((prev) =>
        prev
          ? prev.map((r, i) =>
              i === index
                ? {
                    ...r,
                    revalidating: false,
                    revalidateError:
                      err?.response?.data?.message || 'Không chạy lại test được. Vui lòng thử lại.',
                  }
                : r,
            )
          : prev,
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--text-main)] flex items-center gap-2">
          <Sparkles className="text-indigo-500" size={24} />
          AI hỗ trợ tạo đề có kiểm soát
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Nhập mục tiêu học cho một hoặc nhiều bài (tối đa {MAX_SPECS}) — hệ thống sinh
          bản nháp bằng Gemini, tự chạy lời giải qua test thật để kiểm tra. Bài chỉ được
          lưu vào ngân hàng đề khi bạn tự đọc và bấm <strong>Lưu</strong> cho từng bài đạt.
        </p>
      </div>

      {/* Form: danh sách spec */}
      <div className="space-y-3">
        {specs.map((spec, index) => (
          <div
            key={index}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)]">
                Bài {index + 1}
              </span>
              {specs.length > 1 && (
                <button
                  onClick={() => removeSpec(index)}
                  className="text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                  aria-label="Xoá bài này"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
                Learning outcome (mục tiêu học) <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                value={spec.learningOutcome}
                onChange={(e) => updateSpec(index, { learningOutcome: e.target.value })}
                placeholder="Ví dụ: Vận dụng vòng lặp for để tính tổng có điều kiện"
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
                  Mức độ
                </label>
                <div className="flex gap-1.5">
                  {LEVEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateSpec(index, { level: opt.value })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        spec.level === opt.value
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
                  Tags (cách nhau bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  value={spec.tagsText}
                  onChange={(e) => updateSpec(index, { tagsText: e.target.value })}
                  placeholder="loop, sum"
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
                Constraints (mỗi dòng một ràng buộc)
              </label>
              <textarea
                value={spec.constraintsText}
                onChange={(e) => updateSpec(index, { constraintsText: e.target.value })}
                placeholder={'1 <= N <= 10^6'}
                rows={2}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2">
          {specs.length < MAX_SPECS && (
            <button
              onClick={addSpec}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
            >
              <Plus size={14} /> Thêm bài ({specs.length}/{MAX_SPECS})
            </button>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <Loader2 size={16} className="animate-spin shrink-0" />
          ) : (
            <Sparkles size={16} className="shrink-0" />
          )}
          <span className="truncate">
            {isGenerating
              ? `Đang sinh ${totalGenerating} bài... (${elapsedSeconds}s)`
              : `Sinh ${specs.filter((s) => s.learningOutcome.trim()).length || ''} bài tập`}
          </span>
        </button>
        {isGenerating && (
          <p className="text-center text-[11px] text-[var(--text-muted)]">
            Có thể mất vài phút — mỗi bài chạy tuần tự qua Gemini và test thật.
          </p>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3 text-xs flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" /> {errorMsg}
          </div>
        )}
      </div>

      {/* Lỗi từng bài (partial success) — chỉ những bài lỗi, không chặn xem
          các bài đã sinh thành công bên dưới, kèm nút thử lại riêng từng bài. */}
      {genErrors.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            {genErrors.length} bài sinh thất bại
          </h2>
          {/* max-h + overflow-y-auto: tối đa MAX_SPECS (10) bài lỗi cùng lúc —
              cuộn riêng trong khung thay vì đẩy dài toàn trang. */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {genErrors.map((g, index) => (
              <div
                key={`${g.error.specIndex}-${g.error.topic}`}
                className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-main)] truncate">
                    {g.error.topic}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 truncate" title={g.error.reason}>
                    {g.error.reason}
                  </p>
                </div>
                <button
                  onClick={() => handleRetryOne(index)}
                  disabled={retryingIndex !== null}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {retryingIndex === index ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RotateCw size={13} />
                  )}
                  Thử lại
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {results.map((r, index) => (
            <ResultCard
              key={r.item.draft.specId}
              state={r}
              onSave={() => handleSave(index)}
              onToggleOverride={() => handleToggleOverride(index)}
              onUpdateOverrideReason={(reason) => handleUpdateOverrideReason(index, reason)}
              onRequestRegenerate={() =>
                handleRequestRegenerateAvoidingDuplicate(
                  r.item.draft.title,
                  r.item.validation.duplicateCandidates.map((d) => d.existingTitle),
                )
              }
              onToggleEdit={() => handleToggleEdit(index)}
              onUpdateDraftField={(field, value) => handleUpdateDraftField(index, field, value)}
              onRevalidate={() => handleRevalidate(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function ResultCard({
  state,
  onSave,
  onToggleOverride,
  onUpdateOverrideReason,
  onRequestRegenerate,
  onToggleEdit,
  onUpdateDraftField,
  onRevalidate,
}: {
  state: ResultItemState;
  onSave: () => void;
  onToggleOverride: () => void;
  onUpdateOverrideReason: (reason: string) => void;
  onRequestRegenerate: () => void;
  onToggleEdit: () => void;
  onUpdateDraftField: (field: 'title' | 'description' | 'solutionCode', value: string) => void;
  onRevalidate: () => void;
}) {
  const {
    item,
    saving,
    saved,
    saveError,
    duplicateOverrideChecked,
    overrideReason,
    editing,
    revalidating,
    revalidateError,
  } = state;
  const { draft, validation, generatorUsed, prompt } = item;

  const hasDuplicate = validation.duplicateCandidates.length > 0;
  const hasHardBlock = validation.hasHardBlockDuplicate;
  const hasSoftDuplicateOnly = hasDuplicate && !hasHardBlock;
  // Điều kiện khoá nút Lưu: vẫn cần allTestsPassed luôn luôn; nếu có cảnh báo
  // trùng lặp thì cần thêm HOẶC hard-block (không bao giờ mở khoá) HOẶC chưa
  // tick xác nhận override cho cảnh báo mềm.
  const isSaveLocked =
    !validation.allTestsPassed ||
    hasHardBlock ||
    (hasSoftDuplicateOnly && !duplicateOverrideChecked);

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {editing ? (
          <input
            type="text"
            value={draft.title}
            onChange={(e) => onUpdateDraftField('title', e.target.value)}
            className="flex-1 min-w-[200px] text-lg font-extrabold text-[var(--text-main)] bg-[var(--bg-main)] border border-indigo-500/40 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        ) : (
          <h2 className="text-lg font-extrabold text-[var(--text-main)]">{draft.title}</h2>
        )}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full px-2.5 py-1">
            {generatorUsed.startsWith('Gemini') ? '🤖 Gemini thật' : '🧪 Stub (chưa cấu hình GEMINI_API_KEY)'}
          </span>
          <button
            type="button"
            onClick={onToggleEdit}
            className={`flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 border transition-colors cursor-pointer ${
              editing
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Pencil size={11} /> {editing ? 'Đang sửa' : 'Sửa'}
          </button>
        </div>
      </div>

      <ReadyBanner
        readyForReview={validation.readyForReview}
        allTestsPassed={validation.allTestsPassed}
        hasHardBlockDuplicate={validation.hasHardBlockDuplicate}
      />

      <div>
        <div className="text-xs font-bold text-[var(--text-muted)] mb-1">Đề bài</div>
        {editing ? (
          <textarea
            value={draft.description}
            onChange={(e) => onUpdateDraftField('description', e.target.value)}
            rows={4}
            className="w-full text-sm text-[var(--text-main)] bg-[var(--bg-main)] border border-indigo-500/40 rounded-lg px-3 py-2 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        ) : (
          <p className="text-sm text-[var(--text-main)] whitespace-pre-wrap leading-relaxed">
            {draft.description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {draft.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5"
          >
            {tag}
          </span>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-[var(--text-muted)]">Reference solution</span>
          {!editing && <CopyButton text={draft.solutionCode} />}
        </div>
        {editing ? (
          <>
            <textarea
              value={draft.solutionCode}
              onChange={(e) => onUpdateDraftField('solutionCode', e.target.value)}
              rows={10}
              spellCheck={false}
              className="w-full text-xs bg-[var(--bg-main)] border border-indigo-500/40 rounded-lg p-3 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={onRevalidate}
                disabled={revalidating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {revalidating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RotateCw size={13} />
                )}
                {revalidating ? 'Đang chạy test...' : 'Chạy lại test'}
              </button>
              <span className="text-[11px] text-[var(--text-muted)]">
                Sửa xong bấm để kiểm tra lại — không tốn lượt gọi Gemini.
              </span>
            </div>
            {revalidateError && (
              <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-2 text-xs flex items-center gap-1.5">
                <AlertTriangle size={12} className="shrink-0" /> {revalidateError}
              </div>
            )}
          </>
        ) : (
          <pre className="text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono">
            {draft.solutionCode}
          </pre>
        )}
      </div>

      <div>
        <div className="text-xs font-bold text-[var(--text-muted)] mb-1.5">
          Test case ({validation.testResults.filter((t) => t.passed).length}/
          {validation.testResults.length} pass)
        </div>
        {validation.syntaxError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-2.5 text-xs mb-2 font-mono whitespace-pre-wrap">
            Lỗi cú pháp: {validation.syntaxError}
          </div>
        )}
        <div className="space-y-1.5">
          {validation.testResults.map((t) => (
            <div
              key={t.index}
              className={`rounded-lg border p-2 text-[11px] font-mono flex items-start gap-2 ${
                t.passed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
              }`}
            >
              {t.passed ? (
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={13} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <div className="text-[var(--text-muted)]">
                  {t.isHidden ? '[hidden]' : '[visible]'} input=
                  <span className="text-[var(--text-main)]">{JSON.stringify(t.input)}</span>
                </div>
                <div className="text-[var(--text-muted)]">
                  expected=<span className="text-[var(--text-main)]">{t.expectedOutput}</span>
                  {!t.passed && (
                    <>
                      {' '}actual=<span className="text-red-600 dark:text-red-400">{t.actualOutput}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {hasDuplicate && (
        <div
          className={`rounded-lg border p-3 text-xs space-y-2 ${
            hasHardBlock
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          <div
            className={`font-bold flex items-center gap-1.5 ${
              hasHardBlock
                ? 'text-red-700 dark:text-red-400'
                : 'text-amber-700 dark:text-amber-300'
            }`}
          >
            <AlertTriangle size={13} />
            {hasHardBlock
              ? 'Trùng gần như tuyệt đối — không thể lưu kể cả khi xác nhận'
              : 'Nghi vấn trùng lặp — cần bạn tự đối chiếu'}
          </div>
          <div className="space-y-1">
            {validation.duplicateCandidates.map((d) => (
              <div key={d.existingSlug} className="text-[var(--text-main)]">
                "{d.existingTitle}" ({d.existingSlug}) — độ tương đồng {(d.similarity * 100).toFixed(0)}%
                {d.isHardBlock && (
                  <span className="ml-1.5 text-[10px] font-bold uppercase text-red-600 dark:text-red-400">
                    Trùng chắc chắn
                  </span>
                )}
              </div>
            ))}
          </div>

          {hasHardBlock ? (
            <p className="text-[var(--text-muted)]">
              Bài này trùng tiêu đề/slug hoặc gần như giống hệt một bài đã có — hãy tự sửa lại nội
              dung hoặc sinh bài khác, không có tuỳ chọn bỏ qua cho trường hợp này.
            </p>
          ) : (
            <>
              <label className="flex items-start gap-2 cursor-pointer text-[var(--text-main)] font-medium pt-1 border-t border-amber-500/20">
                <input
                  type="checkbox"
                  checked={duplicateOverrideChecked}
                  onChange={onToggleOverride}
                  className="mt-0.5 cursor-pointer accent-amber-600"
                />
                Tôi đã đối chiếu và xác nhận bài này khác biệt / muốn tiếp tục lưu (bỏ qua cảnh báo)
              </label>
              {duplicateOverrideChecked && (
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => onUpdateOverrideReason(e.target.value)}
                  placeholder="Lý do bỏ qua (không bắt buộc) — ví dụ: khác thuật toán dù đề bài na ná"
                  className="w-full rounded-lg border border-amber-500/30 bg-[var(--bg-main)] text-[var(--text-main)] px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              )}
            </>
          )}

          <button
            type="button"
            onClick={onRequestRegenerate}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCw size={12} /> Yêu cầu AI sinh lại bài khác (tránh trùng)
          </button>
        </div>
      )}

      <details className="text-xs">
        <summary className="cursor-pointer font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]">
          Xem prompt đã gửi cho AI
        </summary>
        <pre className="mt-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono text-[11px]">
          {prompt}
        </pre>
      </details>

      <div className="pt-1 border-t border-[var(--border-color)]">
        {saved ? (
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={16} /> Đã lưu vào ngân hàng đề (slug: {draft.slug})
          </div>
        ) : (
          <button
            onClick={onSave}
            disabled={isSaveLocked || saving}
            title={
              !validation.allTestsPassed
                ? 'Chỉ lưu được khi reference solution pass mọi test'
                : hasHardBlock
                ? 'Trùng gần như tuyệt đối — không thể lưu kể cả khi xác nhận'
                : hasSoftDuplicateOnly && !duplicateOverrideChecked
                ? 'Hãy tick xác nhận bỏ qua cảnh báo trùng lặp ở trên để mở khoá'
                : undefined
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Đang lưu...' : 'Lưu vào ngân hàng đề'}
          </button>
        )}
        {saveError && (
          <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-2 text-xs flex items-center gap-1.5">
            <AlertTriangle size={12} className="shrink-0" /> {saveError}
          </div>
        )}
      </div>
    </div>
  );
}

function ReadyBanner({
  readyForReview,
  allTestsPassed,
  hasHardBlockDuplicate,
}: {
  readyForReview: boolean;
  allTestsPassed: boolean;
  hasHardBlockDuplicate: boolean;
}) {
  if (readyForReview) {
    return (
      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 p-2.5 text-xs font-semibold flex items-center gap-2">
        <CheckCircle2 size={14} /> Pass mọi test, không nghi trùng lặp — có thể lưu, nhưng vẫn nên đọc lại đề trước.
      </div>
    );
  }
  if (!allTestsPassed) {
    return (
      <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-2.5 text-xs font-semibold flex items-center gap-2">
        <XCircle size={14} /> Reference solution KHÔNG pass hết test — không thể lưu, hãy sinh lại hoặc tự sửa.
      </div>
    );
  }
  if (hasHardBlockDuplicate) {
    return (
      <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-2.5 text-xs font-semibold flex items-center gap-2">
        <XCircle size={14} /> Trùng gần như tuyệt đối với bài đã có — không thể lưu, hãy tự sửa lại nội dung hoặc sinh bài khác.
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 p-2.5 text-xs font-semibold flex items-center gap-2">
      <AlertTriangle size={14} /> Pass test nhưng có nghi vấn trùng lặp — tick xác nhận bỏ qua bên dưới để mở khoá lưu.
    </div>
  );
}

export default TeacherProblemGeneratorPage;
