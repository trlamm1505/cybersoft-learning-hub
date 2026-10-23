import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldAlert, XCircle } from 'lucide-react';
import adminPortalApi from '../axios/adminPortalApi';
import { btnPrimary, btnSecondary, card, ErrorBanner, errorMessage, Field, inputCls, PageHeader, Pill, Skeleton } from '../components/admin/AdminUi';
import { useToast } from '../components/Toast';
import type { GeminiTestResult, PromptConfig } from '../types/adminPortal';
import { charCounter, formatDateTimeVi, formatLatency, GEMINI_KEY_NAME, MASK_PLACEHOLDER, QUERY_STALE_MS, validateApiKey, validatePrompt } from './adminPortalModel';
import { QK } from './adminPortalQueries';

const COUNTER_CLASS = { ok: 'text-[var(--text-muted)]', warn: 'text-amber-600 dark:text-amber-300', over: 'font-semibold text-rose-600 dark:text-rose-300' } as const;

const GeminiKeyCard: React.FC<{ gemini: NonNullable<ReturnType<typeof useConfigs>['data']>['gemini']; encryptionReady: boolean }> = ({ gemini, encryptionReady }) => {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [value, setValue] = useState('');
  const [reveal, setReveal] = useState(false);
  const [result, setResult] = useState<GeminiTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const test = useMutation({
    mutationFn: () => adminPortalApi.testGemini(value.trim() || undefined),
    onSuccess: setResult,
    onError: (err) => setResult({ valid: false, latencyMs: 0, reason: errorMessage(err, 'Không kiểm tra được kết nối.') }),
  });
  const save = useMutation({
    mutationFn: () => adminPortalApi.saveConfig(GEMINI_KEY_NAME, value.trim()),
    onSuccess: () => {
      showToast('Đã lưu API key (mã hóa). Các tính năng AI dùng key mới ngay, không cần khởi động lại.', 'success');
      setValue('');
      setReveal(false);
      setResult(null);
      void qc.invalidateQueries({ queryKey: QK.configs });
      void qc.invalidateQueries({ queryKey: QK.audit });
      void qc.invalidateQueries({ queryKey: QK.health });
    },
    onError: (err) => setError(errorMessage(err, 'Không lưu được API key.')),
  });

  const onSave = () => {
    const problem = validateApiKey(value);
    if (problem) return setError(problem);
    setError(null);
    save.mutate();
  };

  return (
    <section className={`${card} space-y-4 p-6`} aria-label="Gemini API Key">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            <KeyRound size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-main)]">Gemini API Key</h2>
            <p className="text-sm text-[var(--text-muted)]">Khóa được mã hóa AES-256-GCM khi lưu và không bao giờ hiển thị lại dạng đầy đủ.</p>
          </div>
        </div>
        <Pill tone={gemini.configured ? 'green' : 'yellow'}>
          {gemini.configured ? `Đang dùng: ${gemini.masked}` : 'Chưa cấu hình'}
        </Pill>
      </div>

      {!encryptionReady && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-amber-400/60 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" />
          <span>Máy chủ chưa có CONFIG_ENCRYPTION_KEY nên chưa thể lưu khóa mới. Thêm biến này vào file .env rồi khởi động lại BE.</span>
        </div>
      )}

      <Field label="API key mới" hint={gemini.source === 'env' ? 'Đang dùng key từ biến môi trường GEMINI_API_KEY. Lưu key ở đây sẽ được ưu tiên.' : gemini.updatedAt ? `Cập nhật ${formatDateTimeVi(gemini.updatedAt)}` : undefined}>
        <div className="flex gap-2">
          <input
            type={reveal ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            value={value}
            placeholder={gemini.configured ? gemini.masked || MASK_PLACEHOLDER : MASK_PLACEHOLDER}
            onChange={(e) => {
              setValue(e.target.value);
              setResult(null);
              setError(null);
            }}
            className={`${inputCls} font-mono`}
          />
          <button type="button" onClick={() => setReveal((v) => !v)} aria-label={reveal ? 'Ẩn API key' : 'Hiện API key'} aria-pressed={reveal} className={`${btnSecondary} px-3`}>
            {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => test.mutate()} disabled={test.isPending || (!value.trim() && !gemini.configured)} className={btnSecondary}>
          {test.isPending && <Loader2 size={14} className="animate-spin" />} Kiểm tra kết nối
        </button>
        <button onClick={onSave} disabled={save.isPending || !value.trim() || !encryptionReady} className={btnPrimary}>
          {save.isPending && <Loader2 size={14} className="animate-spin" />} Lưu API Key
        </button>
        {result && (
          <span role="status" className={`inline-flex items-center gap-1.5 text-sm font-medium ${result.valid ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
            {result.valid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {result.valid ? `Kết nối thành công · ${formatLatency(result.latencyMs)}` : `Không hợp lệ${result.reason ? `: ${result.reason}` : ''}`}
            {result.valid && result.reason && <span className="font-normal text-[var(--text-muted)]">({result.reason})</span>}
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}
    </section>
  );
};

const PromptEditor: React.FC<{ prompt: PromptConfig }> = ({ prompt }) => {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [text, setText] = useState(prompt.value);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (value: string) => adminPortalApi.saveConfig(prompt.configKey, value),
    onSuccess: () => {
      showToast(`Đã lưu "${prompt.title}". AI dùng cấu hình mới ngay từ yêu cầu kế tiếp.`, 'success');
      void qc.invalidateQueries({ queryKey: QK.configs });
      void qc.invalidateQueries({ queryKey: QK.audit });
    },
    onError: (err) => setError(errorMessage(err, 'Không lưu được cấu hình.')),
  });
  const counter = charCounter(text.length, prompt.maxChars);
  const dirty = text !== prompt.value;

  const onSave = () => {
    const problem = validatePrompt(text, prompt.maxChars);
    if (problem) return setError(problem);
    setError(null);
    save.mutate(text);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--text-muted)]">{prompt.description}</p>
      <textarea
        aria-label={`System prompt: ${prompt.title}`}
        value={text}
        rows={14}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        className={`${inputCls} resize-y font-mono leading-relaxed`}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-3 text-xs">
          <span className={`tabular-nums ${COUNTER_CLASS[counter.tone]}`} aria-live="polite">
            {counter.text} ký tự
          </span>
          <span className="text-[var(--text-muted)]">{prompt.isDefault ? 'Đang dùng bản mặc định' : `Tùy chỉnh · ${formatDateTimeVi(prompt.updatedAt)}`}</span>
        </span>
        <span className="flex gap-2">
          {!prompt.isDefault && (
            <button onClick={() => save.mutate('')} disabled={save.isPending} className={btnSecondary}>
              Về mặc định
            </button>
          )}
          <button onClick={onSave} disabled={save.isPending || !dirty || counter.tone === 'over'} className={btnPrimary}>
            {save.isPending && <Loader2 size={14} className="animate-spin" />} Lưu cấu hình
          </button>
        </span>
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
};

function useConfigs() {
  return useQuery({ queryKey: QK.configs, queryFn: adminPortalApi.configs, staleTime: QUERY_STALE_MS });
}

/** Cấu hình hệ thống (/admin/settings): Gemini API key (che, kiểm tra kết nối) và 3 system prompt của AI. */
export const AdminSettingsPage: React.FC = () => {
  const configs = useConfigs();
  const [active, setActive] = useState<PromptConfig['key']>('coach');
  const data = configs.data;
  const current = data?.prompts.find((p) => p.key === active);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Cấu hình hệ thống" subtitle="Thay đổi có hiệu lực ngay, không cần khởi động lại máy chủ. Mọi thay đổi được ghi vào Nhật ký." />
      <ErrorBanner message={configs.isError ? errorMessage(configs.error, 'Không tải được cấu hình.') : null} onRetry={() => void configs.refetch()} />

      {configs.isPending ? (
        <div className={`${card} space-y-4 p-6`} role="status" aria-label="Đang tải cấu hình">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-64" />
        </div>
      ) : (
        data && <GeminiKeyCard gemini={data.gemini} encryptionReady={data.encryptionReady} />
      )}

      <section className={`${card} p-6`} aria-label="System prompts">
        <h2 className="text-base font-semibold text-[var(--text-main)]">System prompt của AI</h2>
        <div role="tablist" aria-label="Chọn prompt" className="mt-3 flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
          {(data?.prompts ?? [{ key: 'coach', title: 'AI Tutor gợi ý' }, { key: 'debug', title: 'Phân tích lỗi' }, { key: 'ailab', title: 'AI Lab Evaluator' }] as Array<Pick<PromptConfig, 'key' | 'title'>>).map((p) => (
            <button
              key={p.key}
              role="tab"
              aria-selected={active === p.key}
              onClick={() => setActive(p.key)}
              className={`-mb-px cursor-pointer border-b-2 px-3.5 py-2.5 text-sm transition-colors ${
                active === p.key ? 'border-indigo-600 font-semibold text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
        <div className="pt-4">{current ? <PromptEditor key={`${current.key}:${current.updatedAt ?? 'default'}`} prompt={current} /> : <Skeleton className="h-64 w-full" />}</div>
      </section>
    </div>
  );
};

export default AdminSettingsPage;
