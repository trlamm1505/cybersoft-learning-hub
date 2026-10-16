import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { sql as sqlLang, PostgreSQL } from '@codemirror/lang-sql';
import { lightEditorTheme } from '../components/editorTheme';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  KeyRound,
  Link2,
  Loader2,
  Play,
  Send,
  Table2,
  XCircle,
} from 'lucide-react';
import daLabApi from '../axios/daLabApi';
import type {
  DaLab,
  DatasetInfo,
  DatasetTable,
  MyDaSubmission,
  SqlGradeResult,
  SqlPreview,
  SqlRunResult,
} from '../types/daLab';

const errorMessage = (err: any, fallback: string): string =>
  err?.response?.data?.message || fallback;

/* ---------- Cây schema bên trái: dựng hoàn toàn từ data_dictionary của TTS 01 ---------- */

const SchemaTree: React.FC<{ dataset: DatasetInfo | null; error: string | null }> = ({
  dataset,
  error,
}) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (error) {
    return (
      <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 text-sm">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        {error}
      </div>
    );
  }
  if (!dataset) {
    return (
      <div className="flex items-center text-sm text-[var(--text-muted)]">
        <Loader2 className="animate-spin mr-2" size={16} /> Đang lấy schema...
      </div>
    );
  }

  const toggle = (t: DatasetTable) => setOpen((o) => ({ ...o, [t.name]: !(o[t.name] ?? true) }));

  return (
    <div className="space-y-1">
      <div className="text-xs text-[var(--text-muted)] mb-2">
        <div className="font-semibold text-[var(--text-main)]">{dataset.dataset_name}</div>
        <div>
          {dataset.resource_id} · {dataset.version}
        </div>
      </div>
      {dataset.data_dictionary.tables.map((table) => {
        const isOpen = open[table.name] ?? true;
        return (
          <div key={table.name}>
            <button
              onClick={() => toggle(table)}
              className="w-full flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)] py-1 bg-transparent border-none cursor-pointer text-left"
              title={table.description}
            >
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Table2 size={14} className="text-indigo-500" />
              {table.name}
            </button>
            {isOpen && (
              <ul className="ml-5 border-l border-[var(--border-color)] pl-2 space-y-0.5">
                {table.columns.map((c) => (
                  <li
                    key={c.name}
                    className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]"
                    title={c.description}
                  >
                    {c.pk ? (
                      <KeyRound size={11} className="text-amber-500 shrink-0" />
                    ) : c.fk ? (
                      <Link2 size={11} className="text-cyan-500 shrink-0" />
                    ) : (
                      <span className="w-[11px] shrink-0" />
                    )}
                    <span className="font-mono text-[var(--text-main)]">{c.name}</span>
                    <span className="ml-auto font-mono opacity-70">{c.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ---------- Bảng dữ liệu động theo cột trả về ---------- */

const formatCell = (v: unknown) => {
  if (v === null || v === undefined) return <span className="italic opacity-60">NULL</span>;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

const DataTable: React.FC<{ result: SqlPreview }> = ({ result }) => (
  <div>
    <div className="text-xs text-[var(--text-muted)] mb-2">
      {result.rowCount} dòng{result.truncated ? ' (đã cắt bớt khi hiển thị)' : ''}
    </div>
    <div className="overflow-auto max-h-80 rounded-lg border border-[var(--border-color)]">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-[var(--bg-main)]">
          <tr>
            {result.columns.map((c, i) => (
              <th key={`${c}-${i}`} className="px-3 py-2 text-left font-semibold text-[var(--text-main)] whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, r) => (
            <tr key={r} className="border-t border-[var(--border-color)]">
              {row.map((v, c) => (
                <td key={c} className="px-3 py-1.5 font-mono text-xs text-[var(--text-main)] whitespace-nowrap">
                  {formatCell(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ErrorPanel: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="flex items-start gap-2 p-4 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500">
    <XCircle size={18} className="mt-0.5 shrink-0" />
    <div>
      <div className="font-semibold">{title}</div>
      <pre className="text-xs mt-1 whitespace-pre-wrap font-mono">{message}</pre>
    </div>
  </div>
);

const GRADE_STYLE: Record<SqlGradeResult['status'], { label: string; cls: string }> = {
  ACCEPTED: { label: 'Chính xác', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' },
  WRONG_ANSWER: { label: 'Chưa đúng', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-600' },
  REJECTED: { label: 'Bị chặn', cls: 'border-rose-500/30 bg-rose-500/10 text-rose-500' },
  SQL_ERROR: { label: 'Lỗi SQL', cls: 'border-rose-500/30 bg-rose-500/10 text-rose-500' },
};

/* ---------- Kết quả bài Insight đã lưu (của AI và giảng viên) ---------- */

const MySubmissionPanel: React.FC<{ submission: MyDaSubmission }> = ({ submission }) => {
  const graded = submission.status === 'GRADED';
  const reviewedByTeacher = graded && !!submission.reviewedAt;
  const submittedAt = new Date(submission.submittedAt).toLocaleString('vi-VN');

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${
        graded ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-[var(--text-main)]">Kết quả bài làm</div>
        <span className="text-xs text-[var(--text-muted)]">Nộp lúc {submittedAt}</span>
      </div>

      {graded ? (
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 size={20} />
          <span className="text-2xl font-bold">
            {submission.score}/{submission.maxScore}
          </span>
          <span className="text-sm">{reviewedByTeacher ? 'điểm do giảng viên chấm' : 'điểm do AI chấm'}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-sm">
          <Clock size={18} /> ⏳ Bài làm đang chờ giảng viên chấm điểm
        </div>
      )}

      {reviewedByTeacher && submission.teacherComment && (
        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-sm">
          <div className="font-semibold text-[var(--text-main)] mb-1">Nhận xét của giảng viên</div>
          <p className="whitespace-pre-wrap text-[var(--text-main)]">{submission.teacherComment}</p>
        </div>
      )}

      {submission.aiExplanation && (
        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-sm">
          <div className="font-semibold text-[var(--text-main)] mb-1">
            {!graded
              ? 'Lý do AI chuyển chấm thủ công'
              : reviewedByTeacher
                ? 'Thông báo từ hệ thống'
                : 'Nhận xét của AI'}
          </div>
          <p className="whitespace-pre-wrap text-[var(--text-muted)]">{submission.aiExplanation}</p>
        </div>
      )}

      {/* Điểm từng tiêu chí của AI; ẩn khi giảng viên đã chấm đè để không hiện hai điểm mâu thuẫn. */}
      {!reviewedByTeacher &&
        submission.criteria?.map((c) => (
          <div key={c.id} className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-sm">
            <div className="flex justify-between font-semibold text-[var(--text-main)]">
              <span>{c.title}</span>
              <span>
                {c.score}/{c.maxPoints}
              </span>
            </div>
            {c.evidence && <div className="text-xs italic text-[var(--text-muted)] mt-1">“{c.evidence}”</div>}
            {c.reasoning && <div className="text-xs text-[var(--text-main)] mt-1">{c.reasoning}</div>}
            {c.flag && <div className="text-xs text-rose-500 mt-1">{c.flag}</div>}
          </div>
        ))}

      <div>
        <div className="text-xs font-semibold text-[var(--text-muted)] mb-1">Bài làm đã nộp</div>
        <textarea
          readOnly
          value={submission.content}
          rows={4}
          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 text-sm text-[var(--text-main)] resize-y"
        />
      </div>
    </div>
  );
};

/* ---------- Trang làm bài ---------- */

export const DaLabWorkspacePage: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [lab, setLab] = useState<DaLab | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [datasetError, setDatasetError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState<'run' | 'submit' | null>(null);
  const [runResult, setRunResult] = useState<SqlRunResult | null>(null);
  const [gradeResult, setGradeResult] = useState<SqlGradeResult | null>(null);
  const [mySubmission, setMySubmission] = useState<MyDaSubmission | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    setLab(null);
    setLoadError(null);
    setDataset(null);
    setDatasetError(null);
    setRunResult(null);
    setGradeResult(null);
    setMySubmission(null);
    daLabApi
      .getLab(slug)
      .then((l) => {
        setLab(l);
        setCode(l.starterCode || 'SELECT\n');
        if (l.type === 'DA_INSIGHT') {
          // Lỗi ở đây không chặn trang: học viên vẫn làm bài được, chỉ thiếu kết quả cũ.
          daLabApi.getMySubmission(l._id).then(setMySubmission).catch(console.error);
        }
      })
      .catch((err) => setLoadError(errorMessage(err, 'Không tải được bài lab.')));
    daLabApi
      .getLabDataset(slug)
      .then(setDataset)
      .catch((err) =>
        setDatasetError(errorMessage(err, 'Không lấy được schema từ Data & AI Resource.')),
      );
  }, [slug]);

  const clearResults = () => {
    setRunResult(null);
    setGradeResult(null);
    setRequestError(null);
  };

  const handleRun = async () => {
    clearResults();
    setBusy('run');
    try {
      setRunResult(await daLabApi.runSql(slug, code));
    } catch (err) {
      setRequestError(errorMessage(err, 'Không chạy được câu SQL. Vui lòng thử lại.'));
    } finally {
      setBusy(null);
    }
  };

  const handleSubmit = async () => {
    clearResults();
    setBusy('submit');
    try {
      if (lab?.type === 'DA_INSIGHT') {
        await daLabApi.submitInsight(slug, answer);
        // Hiển thị đúng bản đã lưu trong DB, cùng nguồn với điểm giảng viên chấm sau này.
        setMySubmission(await daLabApi.getMySubmission(lab._id));
        setAnswer('');
      } else {
        setGradeResult(await daLabApi.submitSql(slug, code));
      }
    } catch (err) {
      setRequestError(errorMessage(err, 'Nộp bài thất bại. Vui lòng thử lại.'));
    } finally {
      setBusy(null);
    }
  };

  if (loadError) {
    return <ErrorPanel title="Không mở được bài lab" message={loadError} />;
  }
  if (!lab) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--text-muted)]">
        <Loader2 className="animate-spin mr-2" size={20} /> Đang tải bài lab...
      </div>
    );
  }

  const isInsight = lab.type === 'DA_INSIGHT';
  const shownResult = gradeResult?.result ?? (runResult?.status === 'OK' ? runResult.result : undefined);

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate('/da-labs')}
        className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] bg-transparent border-none cursor-pointer"
      >
        <ArrowLeft size={16} /> Danh sách bài lab
      </button>

      <div>
        <h1 className="text-xl font-bold text-[var(--text-main)]">{lab.title}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1 whitespace-pre-line">{lab.description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <aside className="lg:col-span-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 max-h-[480px] overflow-auto">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)] mb-2">
            <Database size={15} /> Cấu trúc dữ liệu
          </div>
          <SchemaTree dataset={dataset} error={datasetError} />
        </aside>

        <section className="lg:col-span-3 space-y-3">
          <div className="rounded-xl overflow-hidden border border-[var(--border-color)]">
            <CodeMirror
              value={code}
              height={isInsight ? '200px' : '320px'}
              theme={isDark ? 'dark' : 'light'}
              extensions={isDark ? [sqlLang({ dialect: PostgreSQL })] : [sqlLang({ dialect: PostgreSQL }), lightEditorTheme]}
              onChange={setCode}
            />
          </div>

          {isInsight && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-[var(--text-main)]">Insight của bạn</div>
              <ul className="text-xs text-[var(--text-muted)] list-disc ml-5">
                {lab.insightRubric?.map((c) => (
                  <li key={c.id}>
                    <b>{c.title}</b> ({c.maxPoints}đ): {c.description}
                  </li>
                ))}
              </ul>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={6}
                placeholder="Viết nhận định, số liệu chứng minh và đề xuất thành các câu hoàn chỉnh..."
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text-main)]"
              />
              {mySubmission && <MySubmissionPanel submission={mySubmission} />}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleRun}
              disabled={busy !== null}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-semibold text-[var(--text-main)] cursor-pointer disabled:opacity-50"
            >
              {busy === 'run' ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              Chạy thử
            </button>
            <button
              onClick={handleSubmit}
              disabled={busy !== null}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 border-none"
            >
              {busy === 'submit' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {isInsight ? 'Nộp Insight' : 'Nộp bài'}
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-3">
        <div className="text-sm font-semibold text-[var(--text-main)]">Kết quả</div>

        {!runResult && !gradeResult && !requestError && (
          <p className="text-sm text-[var(--text-muted)]">Bấm "Chạy thử" để xem dữ liệu trả về.</p>
        )}

        {requestError && <ErrorPanel title="Không thực hiện được" message={requestError} />}

        {runResult && runResult.status !== 'OK' && (
          <ErrorPanel
            title={runResult.status === 'REJECTED' ? 'Câu lệnh bị chặn' : 'Lỗi SQL'}
            message={runResult.error ?? ''}
          />
        )}

        {gradeResult && (
          <div className={`flex items-start gap-2 p-3 rounded-lg border ${GRADE_STYLE[gradeResult.status].cls}`}>
            {gradeResult.status === 'ACCEPTED' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <div className="text-sm">
              <b>
                {GRADE_STYLE[gradeResult.status].label}: {gradeResult.score}/{gradeResult.maxScore} điểm
              </b>
              <pre className="whitespace-pre-wrap font-sans mt-0.5">{gradeResult.feedback}</pre>
            </div>
          </div>
        )}

        {shownResult && <DataTable result={shownResult} />}
      </section>
    </div>
  );
};

export default DaLabWorkspacePage;
