import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Download,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import testerLabApi from '../axios/testerLabApi';
import { TesterLabReviewPanel } from '../components/TesterLabReviewPanel';
import type { TesterLab, TesterLabSubmission } from '../types/testerLab';

const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  isStudent: boolean;
}

export const TesterLabDetailPage: React.FC<Props> = ({ isStudent }) => {
  const { labCode = '' } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [lab, setLab] = useState<TesterLab | null>(null);
  const [submissions, setSubmissions] = useState<TesterLabSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadOk, setUploadOk] = useState(false);

  const load = useCallback(async () => {
    try {
      const [labRes, mine] = await Promise.all([
        testerLabApi.getLab(labCode),
        isStudent ? testerLabApi.getMySubmissions(labCode) : Promise.resolve([]),
      ]);
      setLab(labRes);
      setSubmissions(mine);
    } catch (err) {
      console.error(err);
      setError('Không tải được lab. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [labCode, isStudent]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFile = async (file: File | undefined) => {
    if (!file || !lab) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!lab.allowedFileTypes.includes(ext)) {
      setUploadError(`Bài này chỉ nhận: ${lab.allowedFileTypes.map((t) => `.${t}`).join(', ')}`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError('File vượt quá giới hạn 5MB');
      return;
    }
    setUploadError(null);
    setUploadOk(false);
    setUploading(true);
    try {
      await testerLabApi.submitArtifact(lab.labCode, file);
      setSubmissions(await testerLabApi.getMySubmissions(lab.labCode));
      setUploadOk(true);
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || 'Nộp bài thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--text-muted)]">
        <Loader2 className="animate-spin mr-2" size={20} />
        Đang tải lab...
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="flex items-center gap-2 p-6 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500">
        <AlertTriangle size={18} />
        {error ?? 'Không tìm thấy lab.'}
      </div>
    );
  }

  const totalMax = lab.rubricCriteria.reduce((s, c) => s + c.maxScore, 0);
  const isUrl = /^https?:\/\//.test(lab.environmentUrl);
  const cardClass = 'rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5';
  const accept = lab.allowedFileTypes.map((t) => `.${t}`).join(',');

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/tester-labs')}
        className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] bg-transparent border-none cursor-pointer"
      >
        <ArrowLeft size={14} /> Danh sách lab
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cột trái: đề, template, môi trường */}
        <div className="space-y-4">
          <div className={cardClass}>
            <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400">
              {lab.labCode}
            </span>
            <h1 className="text-xl font-bold text-[var(--text-main)] mt-1">{lab.title}</h1>
            <p className="text-sm text-[var(--text-muted)] mt-2">{lab.description}</p>
          </div>

          <div className={cardClass}>
            <h2 className="font-semibold text-[var(--text-main)] mb-2">Môi trường demo</h2>
            {isUrl ? (
              <a
                href={lab.environmentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-cyan-400 break-all"
              >
                <ExternalLink size={14} /> {lab.environmentUrl}
              </a>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">{lab.environmentUrl}</p>
            )}
          </div>

          <div className={cardClass}>
            <h2 className="font-semibold text-[var(--text-main)] mb-2">Tài liệu</h2>
            <div className="flex flex-wrap gap-2">
              {[lab.templateArtifact, ...lab.fixtureUrls].map((name, i) => (
                <button
                  key={name + i}
                  onClick={() => testerLabApi.downloadAsset(lab.labCode, name)}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-main)] bg-transparent cursor-pointer hover:border-indigo-500"
                >
                  <Download size={14} />
                  {i === 0 ? `Template (${name})` : `Fixture (${name})`}
                </button>
              ))}
            </div>
            {lab.requiredColumns.length > 0 && (
              <p className="text-xs text-[var(--text-muted)] mt-3">
                Cột bắt buộc: {lab.requiredColumns.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Cột phải: nộp bài + rubric */}
        <div className="space-y-4">
          {isStudent && (
          <div className={cardClass}>
            <h2 className="font-semibold text-[var(--text-main)] mb-2">Nộp artifact</h2>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed cursor-pointer text-sm text-[var(--text-muted)] ${
                dragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-[var(--border-color)]'
              }`}
            >
              {uploading ? <Loader2 className="animate-spin" size={24} /> : <UploadCloud size={24} />}
              <span>Kéo thả file vào đây hoặc bấm để chọn</span>
              <span className="text-xs">{accept} — tối đa 5MB</span>
              <input
                ref={inputRef}
                type="file"
                hidden
                accept={accept}
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
            {uploadError && <p className="text-sm text-rose-500 mt-2">{uploadError}</p>}
            {uploadOk && <p className="text-sm text-emerald-500 mt-2">Đã nộp bài thành công. Xem kết quả kiểm tra tự động bên dưới.</p>}
          </div>

          )}

          <div className={cardClass}>
            <h2 className="font-semibold text-[var(--text-main)] mb-2">
              Rubric chấm điểm ({totalMax} điểm)
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)]">
                  <th className="py-1 font-medium">Tiêu chí</th>
                  <th className="py-1 font-medium">Nhóm</th>
                  <th className="py-1 font-medium text-right">Điểm</th>
                </tr>
              </thead>
              <tbody>
                {lab.rubricCriteria.map((c) => (
                  <tr key={c.key} className="border-t border-[var(--border-color)]">
                    <td className="py-2 pr-2 text-[var(--text-main)]">{c.label}</td>
                    <td className="py-2 pr-2 text-[var(--text-muted)]">
                      {c.kind === 'severity' ? 'Severity' : 'Quality'}
                    </td>
                    <td className="py-2 text-right text-[var(--text-main)]">{c.maxScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Severity: phân loại bug / kết quả pass-fail. Quality: trình bày, bước tái hiện, độ bao phủ.
            </p>
          </div>

          {isStudent && submissions.length > 0 && (
            <div className={cardClass}>
              <h2 className="font-semibold text-[var(--text-main)] mb-2">Bài nộp của tôi</h2>
              <ul className="space-y-3 list-none p-0 m-0">
                {submissions.map((s) => {
                  const score = s.rubricGrades.reduce((sum, g) => sum + g.score, 0);
                  return (
                    <li
                      key={s._id}
                      className="text-sm border-t first:border-t-0 border-[var(--border-color)] pt-3 first:pt-0"
                    >
                      <div className="flex justify-between text-[var(--text-main)]">
                        <span>
                          {new Date(s.createdAt).toLocaleString('vi-VN')} — .{s.fileType}
                        </span>
                        <span className="font-semibold">
                          {s.status === 'REVIEWED' ? `${score}/${totalMax}` : 'Chờ chấm'}
                        </span>
                      </div>
                      <ul className="mt-1 space-y-0.5 list-none p-0">
                        {s.autoCheckResults.map((r) => (
                          <li
                            key={r.check}
                            className={`flex items-center gap-1 text-xs ${
                              r.passed ? 'text-emerald-500' : 'text-amber-500'
                            }`}
                          >
                            {r.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {r.message}
                          </li>
                        ))}
                      </ul>
                      {s.reviewerNotes && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          Nhận xét: {s.reviewerNotes}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <TesterLabReviewPanel lab={lab} isStudent={isStudent} />
        </div>
      </div>
    </div>
  );
};

export default TesterLabDetailPage;
