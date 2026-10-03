import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Coins,
  Fingerprint,
  Gauge,
  ListChecks,
  Loader2,
  Play,
  Timer,
  XCircle,
} from 'lucide-react';
import aiLabApi from '../axios/aiLabApi';
import { useToast } from '../components/Toast';
// Cùng một bộ mẫu với BE (NoSecretsPipe): kiểm tra sớm để key không rời máy học viên.
import { API_KEY_LEAK_MESSAGE, containsSecret } from '../../../BE/src/common/security/secret-patterns';
import type {
  AiLabConfig,
  AiLabDetail,
  AiLabHistoryEntry,
  AiLabRun,
  EvaluationSetPreview,
} from '../types/aiLab';
import { historyEntryToRun, newestFirst } from './aiLabHistory';

const MAX_PROMPT_CHARS = 6000;

const CATEGORY_LABEL: Record<string, string> = {
  standard_qa: 'Câu thường',
  ambiguous_multihop: 'Multi-hop',
  unanswerable_out_of_domain: 'Ngoài phạm vi',
  adversarial_injection: 'Prompt injection',
  adversarial_distractor: 'Câu bẫy',
};

const errorMessage = (err: any, fallback: string): string => {
  const msg = err?.response?.data?.message;
  return (Array.isArray(msg) ? msg.join(', ') : msg) || fallback;
};

const formatUsd = (n: number) => `$${n.toFixed(6)}`;

const fieldCls =
  'w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-main)]';
const cardCls = 'rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4';

/* ---------- Cột trái: preview evaluation set lấy từ Data & AI Resource ---------- */

const EvalSetPanel: React.FC<{ evalSet: EvaluationSetPreview | null; error: string | null }> = ({
  evalSet,
  error,
}) => {
  if (error) {
    return (
      <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 text-sm">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        {error}
      </div>
    );
  }
  if (!evalSet) {
    return (
      <div className="flex items-center text-sm text-[var(--text-muted)]">
        <Loader2 className="animate-spin mr-2" size={16} /> Đang lấy evaluation set...
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="text-xs text-[var(--text-muted)]">
        <div className="font-semibold text-[var(--text-main)]">{evalSet.name}</div>
        <div className="font-mono">
          {evalSet.resource_id} · {evalSet.version} · {evalSet.total} câu
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(evalSet.categories).map(([cat, count]) => (
          <span
            key={cat}
            className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--border-color)] text-[var(--text-muted)]"
          >
            {CATEGORY_LABEL[cat] ?? cat}: {count}
          </span>
        ))}
      </div>
      <ul className="space-y-2">
        {evalSet.preview.map((q) => (
          <li key={q.question_id} className="rounded-lg border border-[var(--border-color)] p-2.5 text-sm">
            <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
              <span className="font-mono text-indigo-600 dark:text-cyan-400">{q.question_id}</span>
              <span className={q.expected_behavior === 'ABSTAIN' ? 'text-amber-600' : 'text-emerald-600'}>
                {CATEGORY_LABEL[q.category] ?? q.category} · {q.expected_behavior === 'ABSTAIN' ? 'cần từ chối' : 'cần trả lời'}
              </span>
            </div>
            <p className="text-[var(--text-main)]">{q.query}</p>
          </li>
        ))}
      </ul>
      {evalSet.total > evalSet.preview.length && (
        <p className="text-xs text-[var(--text-muted)]">
          Còn {evalSet.total - evalSet.preview.length} câu ẩn. Đáp án chuẩn được giữ ở backend.
        </p>
      )}
    </div>
  );
};

/* ---------- Run Manifest: chất lượng, chi phí, độ trễ ---------- */

const StatTile: React.FC<{
  Icon: typeof Gauge;
  label: string;
  value: string;
  limit: string;
  ok: boolean;
}> = ({ Icon, label, value, limit, ok }) => (
  <div
    className={`rounded-xl border p-3 ${
      ok ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5'
    }`}
  >
    <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
      <Icon size={14} /> {label}
    </div>
    <div className={`text-2xl font-bold mt-1 ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
      {value}
    </div>
    <div className="text-xs text-[var(--text-muted)]">{limit}</div>
  </div>
);

const RunManifestPanel: React.FC<{ run: AiLabRun }> = ({ run }) => {
  const m = run.runManifest;
  const passed = run.status === 'PASSED';

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          Icon={Gauge}
          label="Điểm chất lượng"
          value={`${run.qualityScore}/100`}
          limit={`Ngưỡng đạt ${m.passQuality}`}
          ok={run.qualityScore >= m.passQuality}
        />
        <StatTile
          Icon={Coins}
          label="Chi phí (cả bộ)"
          value={formatUsd(run.cost)}
          limit={`Ngân sách ${formatUsd(m.budget.maxCostUsd)}`}
          ok={run.cost <= m.budget.maxCostUsd}
        />
        <StatTile
          Icon={Timer}
          label="Độ trễ TB / câu"
          value={`${run.latency} ms`}
          limit={`Ngân sách ${m.budget.maxLatencyMs} ms`}
          ok={run.latency <= m.budget.maxLatencyMs}
        />
      </div>

      <div
        className={`flex flex-wrap items-center gap-3 p-3 rounded-lg border ${
          passed
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-600'
        }`}
      >
        {passed ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
        <span className="text-lg font-bold">
          {run.score}/{run.maxScore} điểm
        </span>
        <span className="text-sm font-semibold">{passed ? 'Đạt' : 'Chưa đạt'}</span>
        {m.penalties.map((p) => (
          <span key={p.type} className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-semibold">
            −{p.points}đ vượt {p.type === 'COST' ? 'chi phí' : 'độ trễ'}
          </span>
        ))}
      </div>

      {m.structureWarning && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 text-sm">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {m.structureWarning}
        </div>
      )}

      {run.totalAttempts !== undefined && (
        <div className="text-xs text-[var(--text-muted)]">
          Tổng {run.totalAttempts} lần chạy
          {run.best && ` · Điểm cao nhất ${run.best.score}/${run.maxScore}`}
          {run.bestQualityScore !== undefined && ` · Chất lượng cao nhất ${run.bestQualityScore}/100`}
        </div>
      )}

      <div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)] mb-2">
          <ListChecks size={15} /> Kỹ thuật prompt ({Math.round(m.techniqueCoverage * 100)}% trọng số)
        </div>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {m.techniques.map((t) => (
            <li key={t.id} className="flex items-start gap-1.5 text-xs">
              {t.matched ? (
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
              )}
              <span className="text-[var(--text-main)]">
                <b>{t.label}</b>
                {!t.matched && <span className="text-[var(--text-muted)]"> — {t.hint}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-auto rounded-lg border border-[var(--border-color)]">
        <table className="min-w-full text-xs">
          <thead className="bg-[var(--bg-main)]">
            <tr className="text-left text-[var(--text-main)]">
              {['Câu', 'Loại', 'F1', 'Token vào/ra', 'Chi phí', 'Độ trễ', 'Ghi chú'].map((h) => (
                <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.items.map((i) => (
              <tr key={i.question_id} className="border-t border-[var(--border-color)] text-[var(--text-main)]">
                <td className="px-3 py-1.5 font-mono">{i.question_id}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">{CATEGORY_LABEL[i.category] ?? i.category}</td>
                <td className="px-3 py-1.5 font-mono">{i.f1.toFixed(2)}</td>
                <td className="px-3 py-1.5 font-mono">
                  {i.inputTokens}/{i.outputTokens}
                </td>
                <td className="px-3 py-1.5 font-mono">{formatUsd(i.costUsd)}</td>
                <td className="px-3 py-1.5 font-mono">{i.latencyMs} ms</td>
                <td className="px-3 py-1.5 text-rose-500 whitespace-nowrap">
                  {[
                    i.failedByMissingTechnique && 'trả lời sai do thiếu kỹ thuật',
                    !i.retrieved && 'truy xuất trượt',
                    i.truncated && 'bị cắt do maxTokens',
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-1.5 text-[11px] font-mono text-[var(--text-muted)] break-all">
        <Fingerprint size={13} className="shrink-0 mt-0.5" />
        <span>
          {m.graderVersion} · eval {m.evaluationSet.resource_id}@{m.evaluationSet.version} (
          {m.evaluationSet.checksum.slice(0, 12)}) · model {m.model.id} · config {JSON.stringify(m.config)} · prompt{' '}
          {m.promptSha256.slice(0, 12)} · seed {m.seed}
        </span>
      </div>
    </div>
  );
};

/* ---------- Lịch sử thí nghiệm: tối đa 5 lần chạy gần nhất ---------- */

const HistoryPanel: React.FC<{
  history: AiLabHistoryEntry[];
  maxScore: number;
  viewingAt: string | null;
  onView: (entry: AiLabHistoryEntry) => void;
  onReuse: (entry: AiLabHistoryEntry) => void;
}> = ({ history, maxScore, viewingAt, onView, onReuse }) => (
  <div className="overflow-auto rounded-lg border border-[var(--border-color)]">
    <table className="min-w-full text-xs">
      <thead className="bg-[var(--bg-main)]">
        <tr className="text-left text-[var(--text-main)]">
          {['Thời điểm', 'Điểm', 'Chất lượng', 'Chi phí', 'Độ trễ', 'Model', 'Prompt', ''].map((h) => (
            <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {newestFirst(history).map((h) => (
          <tr
            key={h.createdAt}
            className={`border-t border-[var(--border-color)] text-[var(--text-main)] ${
              viewingAt === h.createdAt ? 'bg-indigo-500/10' : ''
            }`}
          >
            <td className="px-3 py-1.5 whitespace-nowrap">{new Date(h.createdAt).toLocaleString('vi-VN')}</td>
            <td className="px-3 py-1.5 font-mono">
              {h.score}/{maxScore} {h.status === 'PASSED' ? '✓' : ''}
            </td>
            <td className="px-3 py-1.5 font-mono">{h.qualityScore}</td>
            <td className="px-3 py-1.5 font-mono">{formatUsd(h.cost)}</td>
            <td className="px-3 py-1.5 font-mono">{h.latency} ms</td>
            <td className="px-3 py-1.5 font-mono">{h.model}</td>
            <td className="px-3 py-1.5 font-mono" title={h.prompt}>
              {h.promptHash.slice(0, 8)}
            </td>
            <td className="px-3 py-1.5 whitespace-nowrap space-x-2">
              <button
                onClick={() => onView(h)}
                className="text-indigo-600 dark:text-cyan-400 font-semibold bg-transparent border-none cursor-pointer"
              >
                Xem
              </button>
              <button
                onClick={() => onReuse(h)}
                className="text-indigo-600 dark:text-cyan-400 font-semibold bg-transparent border-none cursor-pointer"
              >
                Dùng lại
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ---------- Trang làm bài ---------- */

export const AiLabWorkspacePage: React.FC = () => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [lab, setLab] = useState<AiLabDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [evalSet, setEvalSet] = useState<EvaluationSetPreview | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('');
  const [config, setConfig] = useState<AiLabConfig>({ temperature: 0.2, maxTokens: 256 });
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<AiLabRun | null>(null);
  // Lần chạy trong lịch sử đang xem (null = lần mới nhất).
  const [viewing, setViewing] = useState<AiLabHistoryEntry | null>(null);

  useEffect(() => {
    // Chuyển bài nhanh: response của bài cũ về sau không được ghi đè bài đang mở.
    let cancelled = false;
    setLab(null);
    setLoadError(null);
    setEvalSet(null);
    setEvalError(null);
    setRun(null);
    setViewing(null);
    aiLabApi
      .getLab(slug)
      .then(async (l) => {
        if (cancelled) return;
        setLab(l);
        setPrompt(l.starterCode);
        setModel(l.catalog.models[0]?.id ?? '');
        setConfig(
          l.spec.rag
            ? { temperature: 0.2, maxTokens: 256, topK: 3, embeddingModel: l.catalog.embeddingModels[0]?.id }
            : { temperature: 0.2, maxTokens: 256 },
        );
        // Nạp lại cấu hình lần chạy gần nhất; lỗi ở đây không chặn trang.
        const last = await aiLabApi.getMySubmission(slug).catch(() => null);
        if (last && !cancelled) {
          setRun(last);
          if (last.prompt) setPrompt(last.prompt);
          if (last.model) setModel(last.model);
          if (last.config) setConfig(last.config);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err, 'Không tải được bài lab.'));
      });
    aiLabApi
      .getEvaluationPreview(slug)
      .then((preview) => {
        if (!cancelled) setEvalSet(preview);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = errorMessage(err, 'Không lấy được evaluation set từ Data & AI Resource.');
        setEvalError(msg);
        showToast(msg, 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [slug, showToast]);

  const handleSubmit = async () => {
    const payload = { prompt, model, config };
    if (containsSecret(payload)) {
      showToast(API_KEY_LEAK_MESSAGE, 'error');
      return;
    }
    setBusy(true);
    try {
      setRun(await aiLabApi.submit(slug, payload));
      setViewing(null);
    } catch (err) {
      showToast(errorMessage(err, 'Chạy đánh giá thất bại. Vui lòng thử lại.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex items-start gap-2 p-4 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500">
        <XCircle size={18} className="mt-0.5 shrink-0" />
        {loadError}
      </div>
    );
  }
  if (!lab) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--text-muted)]">
        <Loader2 className="animate-spin mr-2" size={20} /> Đang tải bài lab...
      </div>
    );
  }

  const { spec, catalog } = lab;
  const limits = catalog.configLimits;
  const setNum = (key: keyof AiLabConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setConfig((c) => ({ ...c, [key]: Number(e.target.value) }));
  const selectedModel = catalog.models.find((m) => m.id === model);

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate('/ai-labs')}
        className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] bg-transparent border-none cursor-pointer"
      >
        <ArrowLeft size={16} /> Danh sách bài lab
      </button>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Cột trái: đề bài + evaluation set */}
        <aside className="lg:col-span-2 space-y-4">
          <div className={cardCls}>
            <div className="text-xs font-bold text-indigo-600 dark:text-cyan-400">
              {lab.slug.toUpperCase()} · {lab.points}đ
            </div>
            <h1 className="text-xl font-bold text-[var(--text-main)] mt-1">{lab.title}</h1>
            <p className="text-sm text-[var(--text-muted)] mt-2 whitespace-pre-line">{lab.description}</p>
            <div className="mt-3 text-xs text-[var(--text-main)] space-y-1">
              <div>
                Đạt khi chất lượng ≥ <b>{spec.passQuality}</b> và trong ngân sách{' '}
                <b>{formatUsd(spec.budget.maxCostUsd)}</b> / <b>{spec.budget.maxLatencyMs} ms</b>.
              </div>
              <div className="text-[var(--text-muted)]">Mỗi lần vượt ngân sách bị trừ 20% điểm tối đa.</div>
            </div>
            <div className="mt-3">
              <div className="text-xs font-semibold text-[var(--text-main)] mb-1">Kỹ thuật được chấm</div>
              <ul className="text-xs text-[var(--text-muted)] list-disc ml-5 space-y-0.5">
                {spec.techniques.map((t) => (
                  <li key={t.id}>
                    <b className="text-[var(--text-main)]">{t.label}</b>: {t.hint}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={cardCls}>
            <div className="text-sm font-semibold text-[var(--text-main)] mb-2">Evaluation set</div>
            <EvalSetPanel evalSet={evalSet} error={evalError} />
          </div>
        </aside>

        {/* Cột phải: model, config, prompt */}
        <section className={`lg:col-span-3 space-y-4 ${cardCls}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--text-main)] space-y-1">
              <span>Model</span>
              <select value={model} onChange={(e) => setModel(e.target.value)} className={fieldCls}>
                {catalog.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              {selectedModel && (
                <span className="block text-xs font-normal text-[var(--text-muted)]">
                  ${selectedModel.inputUsdPerMTok} vào / ${selectedModel.outputUsdPerMTok} ra mỗi 1M token (mô phỏng)
                </span>
              )}
            </label>

            {spec.rag && (
              <label className="text-sm font-semibold text-[var(--text-main)] space-y-1">
                <span>Embedding model</span>
                <select
                  value={config.embeddingModel}
                  onChange={(e) => setConfig((c) => ({ ...c, embeddingModel: e.target.value }))}
                  className={fieldCls}
                >
                  {catalog.embeddingModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="text-sm font-semibold text-[var(--text-main)] space-y-1">
              <span className="flex justify-between">
                Temperature <span className="font-mono">{config.temperature.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={limits.temperature.min}
                max={limits.temperature.max}
                step={0.05}
                value={config.temperature}
                onChange={setNum('temperature')}
                className="w-full accent-indigo-600"
              />
            </label>

            <label className="text-sm font-semibold text-[var(--text-main)] space-y-1">
              <span className="flex justify-between">
                Max tokens <span className="font-mono">{config.maxTokens}</span>
              </span>
              <input
                type="range"
                min={limits.maxTokens.min}
                max={limits.maxTokens.max}
                step={16}
                value={config.maxTokens}
                onChange={setNum('maxTokens')}
                className="w-full accent-indigo-600"
              />
            </label>

            {spec.rag && (
              <label className="text-sm font-semibold text-[var(--text-main)] space-y-1">
                <span className="flex justify-between">
                  Top-K đoạn ngữ cảnh <span className="font-mono">{config.topK}</span>
                </span>
                <input
                  type="range"
                  min={limits.topK.min}
                  max={limits.topK.max}
                  step={1}
                  value={config.topK}
                  onChange={setNum('topK')}
                  className="w-full accent-indigo-600"
                />
              </label>
            )}
          </div>

          <label className="block text-sm font-semibold text-[var(--text-main)] space-y-1">
            <span className="flex justify-between">
              Prompt
              <span className={`font-mono text-xs ${prompt.length > MAX_PROMPT_CHARS ? 'text-rose-500' : 'text-[var(--text-muted)]'}`}>
                {prompt.length}/{MAX_PROMPT_CHARS}
              </span>
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={14}
              spellCheck={false}
              placeholder={spec.rag ? 'Dùng {{context}} và {{question}} trong template...' : 'Viết system prompt...'}
              className={`${fieldCls} font-mono resize-y`}
            />
            {spec.rag && (
              <span className="block text-xs font-normal text-[var(--text-muted)]">
                Hệ thống thay <code>{'{{context}}'}</code> bằng top-K đoạn truy xuất và <code>{'{{question}}'}</code>{' '}
                bằng câu hỏi. Không dán API key: mô hình do hệ thống gọi.
              </span>
            )}
          </label>

          <button
            onClick={handleSubmit}
            disabled={busy || !prompt.trim() || !model}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 border-none"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            Chạy & Đánh giá
          </button>
        </section>
      </div>

      <section className={`${cardCls} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-[var(--text-main)]">Run Manifest</div>
          {run && (
            <span className="text-xs text-[var(--text-muted)]">
              Chạy lúc {new Date(run.submittedAt).toLocaleString('vi-VN')}
            </span>
          )}
        </div>
        {run ? (
          <>
            {viewing && (
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-indigo-500/10 text-xs text-[var(--text-main)]">
                <span>Đang xem lần chạy lúc {new Date(viewing.createdAt).toLocaleString('vi-VN')}</span>
                <button
                  onClick={() => setViewing(null)}
                  className="font-semibold text-indigo-600 dark:text-cyan-400 bg-transparent border-none cursor-pointer"
                >
                  Về lần mới nhất
                </button>
              </div>
            )}
            <RunManifestPanel run={viewing ? historyEntryToRun(viewing, run) : run} />
            {(run.history?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[var(--text-main)]">
                  Lịch sử {run.history!.length} lần chạy gần nhất
                </div>
                <HistoryPanel
                  history={run.history!}
                  maxScore={run.maxScore}
                  viewingAt={viewing?.createdAt ?? null}
                  onView={setViewing}
                  onReuse={(h) => {
                    setPrompt(h.prompt);
                    setModel(h.model);
                    setConfig(h.config);
                    showToast('Đã nạp lại prompt và cấu hình của lần chạy này.', 'info');
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Bấm "Chạy & Đánh giá" để chấm prompt trên evaluation set.</p>
        )}
      </section>
    </div>
  );
};

export default AiLabWorkspacePage;
