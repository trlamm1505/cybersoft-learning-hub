import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Code2, FileEdit, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { contestApi } from '../../axios/contestApi';
import { authoringApi } from '../../axios/authoringApi';
import type { ContestProblem, ExerciseBankItem, QuestionBank } from '../../types/contest';
import type { LessonAuthoring } from '../../types/authoring';
import {
  addProblem,
  makeBankProblem,
  moveProblem,
  removeProblem,
  setProblemPoints,
  summarizeProblems,
  MAX_POINTS,
} from './contestForm';

type Source = 'quiz' | 'code' | 'lessons';

const SOURCES: Array<{ key: Source; label: string; hint: string }> = [
  { key: 'quiz', label: 'Trắc nghiệm', hint: 'Chọn câu hỏi từ ngân hàng, ghép thành một phần thi' },
  { key: 'code', label: 'Code Playground', hint: 'Bài code Python có sẵn test case' },
  { key: 'lessons', label: 'Bài tự soạn', hint: 'Bài bạn đã soạn ở mục Soạn Thảo' },
];

const DIFFICULTY_LABEL: Record<string, string> = { EASY: 'Dễ', MEDIUM: 'Vừa', HARD: 'Khó' };

const inputCls =
  'px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500';

const TypeBadge: React.FC<{ type?: 'coding' | 'quiz' }> = ({ type }) =>
  type === 'quiz' ? (
    <span className="inline-flex items-center gap-1 rounded-lg border border-cyan-300 bg-cyan-100 px-2 py-0.5 text-[11px] font-bold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
      <FileEdit size={11} /> Trắc nghiệm
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-lg border border-purple-300 bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
      <Code2 size={11} /> Code
    </span>
  );

interface ProblemPickerProps {
  problems: ContestProblem[];
  onChange: (next: ContestProblem[]) => void;
  /** Cuộc thi đã bắt đầu: chỉ xem, không đổi đề/điểm. */
  locked: boolean;
}

/** Chọn và sắp xếp đề: phối hợp câu hỏi trắc nghiệm, bài Code Playground và bài tự soạn trong cùng một cuộc thi. */
export const ProblemPicker: React.FC<ProblemPickerProps> = ({ problems, onChange, locked }) => {
  const [source, setSource] = useState<Source>('quiz');
  const stats = useMemo(() => summarizeProblems(problems), [problems]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Đề đã chọn */}
      <section className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <h4 className="text-sm font-extrabold text-[var(--text-main)]">Đề đã chọn ({stats.total})</h4>
          <span className="text-xs text-[var(--text-muted)]">
            {stats.quiz} trắc nghiệm · {stats.coding} code · <strong>{stats.totalPoints} điểm</strong>
          </span>
        </div>
        {locked && (
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Cuộc thi đã bắt đầu nên không thể thay đổi đề hoặc điểm.
          </p>
        )}
        {problems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border-color)] p-6 text-center text-xs text-[var(--text-muted)]">
            Chưa có đề nào. Chọn từ danh sách bên phải để thêm.
          </p>
        ) : (
          <ol className="space-y-2">
            {problems.map((p, idx) => (
              <li
                key={p.slug}
                className="flex items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-3"
              >
                <span className="w-6 shrink-0 text-center font-mono text-xs font-bold text-[var(--text-muted)]">{idx + 1}</span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-xs font-bold text-[var(--text-main)]" title={p.title}>
                    {p.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge type={p.type} />
                    {p.source === 'bank' && (
                      <span className="text-[11px] text-[var(--text-muted)]">{p.questionIds?.length ?? 0} câu</span>
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                  <input
                    type="number"
                    min={1}
                    max={MAX_POINTS}
                    disabled={locked}
                    aria-label={`Điểm của ${p.title}`}
                    value={Number.isFinite(p.points) ? p.points : ''}
                    onChange={(e) => onChange(setProblemPoints(problems, p.slug, parseInt(e.target.value, 10) || 0))}
                    className={`${inputCls} w-16 text-center font-mono`}
                  />
                  đ
                </label>
                {!locked && (
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      aria-label="Chuyển lên"
                      disabled={idx === 0}
                      onClick={() => onChange(moveProblem(problems, idx, -1))}
                      className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Chuyển xuống"
                      disabled={idx === problems.length - 1}
                      onClick={() => onChange(moveProblem(problems, idx, 1))}
                      className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Bỏ ${p.title}`}
                      onClick={() => onChange(removeProblem(problems, p.slug))}
                      className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-red-600 dark:text-red-400 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Nguồn đề */}
      <section className="min-w-0 space-y-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Nguồn đề">
          {SOURCES.map((s) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={source === s.key}
              onClick={() => setSource(s.key)}
              className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold ${
                source === s.key
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:border-indigo-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">{SOURCES.find((s) => s.key === source)?.hint}</p>

        {locked ? null : source === 'quiz' ? (
          <QuestionBankPanel problems={problems} onChange={onChange} />
        ) : source === 'code' ? (
          <ExerciseBankPanel problems={problems} onChange={onChange} />
        ) : (
          <LessonsPanel problems={problems} onChange={onChange} />
        )}
      </section>
    </div>
  );
};

interface PanelProps {
  problems: ContestProblem[];
  onChange: (next: ContestProblem[]) => void;
}

const Loading: React.FC = () => (
  <div className="flex items-center py-6 text-xs text-[var(--text-muted)]">
    <Loader2 className="mr-2 animate-spin" size={14} /> Đang tải...
  </div>
);

const ErrorBox: React.FC<{ message: string }> = ({ message }) => (
  <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500">{message}</p>
);

/** Tick chọn câu hỏi trong ngân hàng, đặt tên rồi thêm thành một phần thi. */
const QuestionBankPanel: React.FC<PanelProps> = ({ problems, onChange }) => {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [picked, setPicked] = useState<Record<string, { points: number }>>({});
  const [title, setTitle] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      contestApi
        .getQuestionBank({ q: q || undefined, category: category || undefined, difficulty: difficulty || undefined })
        .then((b) => !cancelled && (setBank(b), setError(null)))
        .catch(() => !cancelled && setError('Không tải được ngân hàng câu hỏi.'));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, category, difficulty]);

  const pickedIds = Object.keys(picked);
  const pickedPoints = pickedIds.reduce((sum, id) => sum + picked[id].points, 0);
  const toggle = (id: string, points: number) =>
    setPicked((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = { points };
      return next;
    });

  const addSection = () => {
    if (pickedIds.length === 0) return;
    onChange(addProblem(problems, makeBankProblem(title, pickedIds, pickedPoints, problems)));
    setPicked({});
    setTitle('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-40 flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm câu hỏi..."
            aria-label="Tìm câu hỏi"
            className={`${inputCls} w-full pl-8`}
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Chủ đề" className={inputCls}>
          <option value="">Mọi chủ đề</option>
          {bank?.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Độ khó" className={inputCls}>
          <option value="">Mọi độ khó</option>
          {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorBox message={error} />
      ) : !bank ? (
        <Loading />
      ) : bank.items.length === 0 ? (
        <p className="py-4 text-center text-xs text-[var(--text-muted)]">Không có câu hỏi phù hợp.</p>
      ) : (
        <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {bank.items.map((item) => {
            const checked = !!picked[item.id];
            return (
              <li key={item.id}>
                <label
                  className={`flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 text-xs ${
                    checked
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50'
                      : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-indigo-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(item.id, item.points)}
                    className="mt-0.5 h-4 w-4 cursor-pointer"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-semibold text-[var(--text-main)]">{item.content}</span>
                    <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                      {item.category} · {DIFFICULTY_LABEL[item.difficulty] ?? item.difficulty} · {item.points}đ
                      {item.hasCode ? ' · có đoạn code' : ''}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-color)] pt-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tên phần thi (ví dụ: Trắc nghiệm Python)"
          aria-label="Tên phần thi trắc nghiệm"
          className={`${inputCls} min-w-40 flex-1`}
        />
        <button
          type="button"
          disabled={pickedIds.length === 0}
          onClick={addSection}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-none bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={13} /> Thêm {pickedIds.length} câu ({pickedPoints}đ)
        </button>
      </div>
    </div>
  );
};

/** Bài Code Playground: bấm để thêm; điểm mặc định lấy từ bài. */
const ExerciseBankPanel: React.FC<PanelProps> = ({ problems, onChange }) => {
  const [items, setItems] = useState<ExerciseBankItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      contestApi
        .getExerciseBank({ q: q || undefined })
        .then((list) => !cancelled && (setItems(list), setError(null)))
        .catch(() => !cancelled && setError('Không tải được danh sách bài Code Playground.'));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  const chosen = new Set(problems.map((p) => p.slug));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm bài code..."
          aria-label="Tìm bài code"
          className={`${inputCls} w-full pl-8`}
        />
      </div>
      {error ? (
        <ErrorBox message={error} />
      ) : !items ? (
        <Loading />
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-xs text-[var(--text-muted)]">Không có bài phù hợp.</p>
      ) : (
        <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
          {items.map((e) => {
            const added = chosen.has(e.slug);
            const noTests = e.testCaseCount === 0;
            return (
              <li
                key={e.slug}
                className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[var(--text-main)]">{e.title}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {DIFFICULTY_LABEL[e.difficulty] ?? e.difficulty} · {e.points}đ · {e.testCaseCount} test case
                    {e.topic ? ` · ${e.topic}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={added || noTests}
                  title={noTests ? 'Bài chưa có test case nên không chấm được' : undefined}
                  onClick={() =>
                    onChange(
                      addProblem(problems, {
                        source: 'exercise',
                        exerciseSlug: e.slug,
                        title: e.title,
                        slug: e.slug,
                        type: 'coding',
                        points: e.points,
                      }),
                    )
                  }
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border-none bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-700"
                >
                  {added ? 'Đã thêm' : (<><Plus size={12} /> Thêm</>)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

/** Bài tự soạn (code hoặc trắc nghiệm); bài khối lệnh không dùng cho cuộc thi. */
const LessonsPanel: React.FC<PanelProps> = ({ problems, onChange }) => {
  const [lessons, setLessons] = useState<LessonAuthoring[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    authoringApi
      .getLessons()
      .then((list) => !cancelled && setLessons(list.filter((l) => l.type === 'coding' || l.type === 'quiz')))
      .catch(() => !cancelled && setError('Không tải được bài tự soạn.'));
    return () => {
      cancelled = true;
    };
  }, []);

  const chosen = new Set(problems.map((p) => p.slug));

  if (error) return <ErrorBox message={error} />;
  if (!lessons) return <Loading />;
  if (lessons.length === 0) {
    return <p className="py-4 text-center text-xs text-[var(--text-muted)]">Bạn chưa soạn bài code hoặc trắc nghiệm nào.</p>;
  }
  return (
    <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
      {lessons.map((l) => {
        const added = chosen.has(l.slug);
        const empty = l.type === 'coding' ? l.testCases.length === 0 : l.quizQuestions.length === 0;
        return (
          <li
            key={l._id ?? l.slug}
            className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 text-xs"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate font-semibold text-[var(--text-main)]">{l.title}</p>
              <div className="flex items-center gap-2">
                <TypeBadge type={l.type === 'quiz' ? 'quiz' : 'coding'} />
                <span className="text-[11px] text-[var(--text-muted)]">{l.points ?? 10}đ</span>
              </div>
            </div>
            <button
              type="button"
              disabled={added || empty}
              title={empty ? 'Bài chưa có test case/câu hỏi nên không chấm được' : undefined}
              onClick={() =>
                onChange(
                  addProblem(problems, {
                    source: 'lesson',
                    lessonId: l._id,
                    title: l.title,
                    slug: l.slug,
                    type: l.type === 'quiz' ? 'quiz' : 'coding',
                    points: l.points ?? 10,
                  }),
                )
              }
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border-none bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-700"
            >
              {added ? 'Đã thêm' : (<><Plus size={12} /> Thêm</>)}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default ProblemPicker;
