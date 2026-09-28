import React, { useState } from 'react';
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
} from 'lucide-react';
import problemGeneratorApi from '../axios/problemGeneratorApi';
import type {
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

// State lưu trong FE cho mỗi item để nút "Lưu" cập nhật đúng dòng, không
// động vào response gốc của backend (draft/validation không đổi sau khi
// sinh — chỉ trạng thái lưu là state cục bộ ở đây).
interface ResultItemState {
  item: GenerateProblemResultItem;
  saving: boolean;
  saved: boolean;
  saveError: string | null;
}

export const TeacherProblemGeneratorPage: React.FC = () => {
  const [specs, setSpecs] = useState<SpecForm[]>([emptySpecForm()]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItemState[] | null>(null);

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

  const canGenerate = specs.some((s) => s.learningOutcome.trim()) && !isGenerating;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    const validSpecs = specs
      .filter((s) => s.learningOutcome.trim())
      .map(toSpecInput);

    setIsGenerating(true);
    setErrorMsg(null);
    setResults(null);

    try {
      const res = await problemGeneratorApi.generate({ specs: validSpecs });
      setResults(
        res.results.map((item) => ({ item, saving: false, saved: false, saveError: null })),
      );
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          'Không sinh được bài tập lúc này. Gemini có thể đang quá tải, hãy thử lại sau ít phút.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (index: number) => {
    if (!results) return;
    const target = results[index];
    if (target.saving || target.saved) return;

    setResults((prev) =>
      prev!.map((r, i) => (i === index ? { ...r, saving: true, saveError: null } : r)),
    );

    try {
      await problemGeneratorApi.save(target.item.draft);
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
                Learning outcome (mục tiêu học) <span className="text-red-500">*</span>
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
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {isGenerating
            ? `Đang sinh ${specs.filter((s) => s.learningOutcome.trim()).length} bài (có thể mất vài phút)...`
            : `Sinh ${specs.filter((s) => s.learningOutcome.trim()).length || ''} bài tập`}
        </button>

        {errorMsg && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3 text-xs flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" /> {errorMsg}
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {results.map((r, index) => (
            <ResultCard
              key={r.item.draft.specId}
              state={r}
              onSave={() => handleSave(index)}
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
}: {
  state: ResultItemState;
  onSave: () => void;
}) {
  const { item, saving, saved, saveError } = state;
  const { draft, validation, generatorUsed, prompt } = item;

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-extrabold text-[var(--text-main)]">{draft.title}</h2>
        <span className="text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full px-2.5 py-1">
          {generatorUsed.startsWith('Gemini') ? '🤖 Gemini thật' : '🧪 Stub (chưa cấu hình GEMINI_API_KEY)'}
        </span>
      </div>

      <ReadyBanner readyForReview={validation.readyForReview} allTestsPassed={validation.allTestsPassed} />

      <div>
        <div className="text-xs font-bold text-[var(--text-muted)] mb-1">Đề bài</div>
        <p className="text-sm text-[var(--text-main)] whitespace-pre-wrap leading-relaxed">
          {draft.description}
        </p>
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
          <CopyButton text={draft.solutionCode} />
        </div>
        <pre className="text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono">
          {draft.solutionCode}
        </pre>
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
                <XCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
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
                      {' '}actual=<span className="text-red-500">{t.actualOutput}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {validation.duplicateCandidates.length > 0 && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs space-y-1">
          <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
            <AlertTriangle size={13} /> Nghi vấn trùng lặp — cần bạn tự đối chiếu
          </div>
          {validation.duplicateCandidates.map((d) => (
            <div key={d.existingSlug} className="text-[var(--text-main)]">
              "{d.existingTitle}" ({d.existingSlug}) — độ tương đồng {(d.similarity * 100).toFixed(0)}%
            </div>
          ))}
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
            disabled={!validation.readyForReview || saving}
            title={
              !validation.readyForReview
                ? 'Chỉ lưu được khi pass mọi test và không nghi trùng lặp'
                : undefined
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
}: {
  readyForReview: boolean;
  allTestsPassed: boolean;
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
  return (
    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 p-2.5 text-xs font-semibold flex items-center gap-2">
      <AlertTriangle size={14} /> Pass test nhưng có nghi vấn trùng lặp — không thể lưu cho tới khi bạn tự xử lý.
    </div>
  );
}

export default TeacherProblemGeneratorPage;
