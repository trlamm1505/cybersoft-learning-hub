import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import teacherAnalyticsApi from '../axios/teacherAnalyticsApi';
import { ClassAssignPanel } from '../components/ClassAssignPanel';
import { selectControl } from '../components/adminStyles';
import type {
  ClassOverview,
  ClassSummary,
  ExerciseDetail,
  ExerciseRow,
  StudentDetail,
  StudentRow,
} from '../types/teacherAnalytics';
import {
  dashboardState,
  difficultyLabel,
  EMPTY,
  EMPTY_MESSAGE,
  formatAvg,
  formatDate,
  formatPercent,
  sortRows,
  STATUS_LABEL,
  type SortDir,
} from './teacherDashboardModel';

type Tab = 'students' | 'exercises';
type Selection = { kind: 'student'; id: string } | { kind: 'exercise'; id: string } | null;

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const cell = 'px-3 py-2 text-sm text-[var(--text-main)] align-middle';
const num = `${cell} text-right tabular-nums`;
const head = 'px-3 py-2 text-xs font-medium text-[var(--text-muted)] whitespace-nowrap';
const rule = 'border-t border-[var(--border-color)]';

const Muted: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="py-6 text-sm text-[var(--text-muted)]">{children}</p>
);

const Stat: React.FC<{ label: string; value: string; note?: string }> = ({ label, value, note }) => (
  <div className="min-w-[8rem] flex-1 px-4 py-3">
    <div className="text-xs text-[var(--text-muted)]">{label}</div>
    <div className="text-2xl font-semibold tabular-nums text-[var(--text-main)]">{value}</div>
    {note && <div className="text-xs text-[var(--text-muted)]">{note}</div>}
  </div>
);

interface Column<T> {
  label: string;
  align?: 'right';
  sort?: (row: T) => number | string | null;
  render: (row: T) => React.ReactNode;
}

/** Bảng phẳng: bấm tiêu đề cột để sắp xếp, bấm dòng để xem chi tiết. */
function DataTable<T>({
  rows,
  columns,
  rowKey,
  selectedKey,
  onSelect,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  selectedKey: string | null;
  onSelect: (row: T) => void;
}) {
  const [sort, setSort] = useState<{ col: number; dir: SortDir } | null>(null);
  const sorted = useMemo(() => {
    const col = sort ? columns[sort.col] : null;
    return col?.sort && sort ? sortRows(rows, col.sort, sort.dir) : rows;
  }, [rows, columns, sort]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            {columns.map((c, i) => {
              const active = sort?.col === i;
              return (
                <th
                  key={c.label}
                  className={`${head} ${c.align === 'right' ? 'text-right' : 'text-left'} ${c.sort ? 'cursor-pointer select-none' : ''}`}
                  aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  onClick={() =>
                    c.sort && setSort({ col: i, dir: active && sort!.dir === 'desc' ? 'asc' : 'desc' })
                  }
                >
                  {c.label}
                  {active ? (sort!.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const key = rowKey(row);
            return (
              <tr
                key={key}
                onClick={() => onSelect(row)}
                className={`${rule} cursor-pointer hover:bg-[var(--bg-card-hover)] ${
                  selectedKey === key ? 'bg-[var(--bg-card-hover)]' : ''
                }`}
                aria-selected={selectedKey === key}
              >
                {columns.map((c) => (
                  <td key={c.label} className={c.align === 'right' ? num : cell}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const studentColumns: Column<StudentRow>[] = [
  { label: 'Học viên', sort: (r) => r.name, render: (r) => r.name },
  {
    label: 'Đạt / bài giao',
    align: 'right',
    sort: (r) => r.completionRate,
    render: (r) => `${r.passedExercises} (${formatPercent(r.completionRate)})`,
  },
  { label: 'Bài đã thử', align: 'right', sort: (r) => r.attemptedExercises, render: (r) => r.attemptedExercises },
  { label: 'Lần thử TB', align: 'right', sort: (r) => r.avgAttempts, render: (r) => formatAvg(r.avgAttempts) },
  { label: 'Gợi ý', align: 'right', sort: (r) => r.hintUnlocks, render: (r) => r.hintUnlocks },
  { label: 'Gần nhất', align: 'right', sort: (r) => r.lastActiveAt, render: (r) => formatDate(r.lastActiveAt) },
];

const exerciseColumns: Column<ExerciseRow>[] = [
  { label: 'Bài tập', sort: (r) => r.title, render: (r) => r.title },
  {
    label: 'Đạt',
    align: 'right',
    sort: (r) => r.passRate,
    render: (r) => `${r.passedStudents}/${r.attemptedStudents} (${formatPercent(r.passRate)})`,
  },
  { label: 'Hoàn thành', align: 'right', sort: (r) => r.completionRate, render: (r) => formatPercent(r.completionRate) },
  { label: 'Lần thử TB', align: 'right', sort: (r) => r.avgAttempts, render: (r) => formatAvg(r.avgAttempts) },
  { label: 'Gợi ý', align: 'right', sort: (r) => r.hintUnlocks, render: (r) => r.hintUnlocks },
  {
    label: 'Độ khó',
    align: 'right',
    sort: (r) => r.difficultyScore,
    render: (r) => difficultyLabel(r.difficultyScore),
  },
];

const DetailTable: React.FC<{
  firstHead: string;
  rows: Array<{ key: string; name: string; status: keyof typeof STATUS_LABEL; attempts: number; hints: number; lastAt: string | null }>;
}> = ({ firstHead, rows }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead>
        <tr>
          <th className={`${head} text-left`}>{firstHead}</th>
          <th className={`${head} text-left`}>Trạng thái</th>
          <th className={`${head} text-right`}>Lần thử</th>
          <th className={`${head} text-right`}>Gợi ý</th>
          <th className={`${head} text-right`}>Gần nhất</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} className={rule}>
            <td className={cell}>{r.name}</td>
            <td className={`${cell} ${r.status === 'PASSED' ? '' : 'text-[var(--text-muted)]'}`}>{STATUS_LABEL[r.status]}</td>
            <td className={num}>{r.attempts || EMPTY}</td>
            <td className={num}>{r.hints || EMPTY}</td>
            <td className={num}>{formatDate(r.lastAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

interface OverviewProps {
  classes: ClassSummary[];
  classId: string;
  setClassId: (id: string) => void;
  /** Tăng lên mỗi khi giảng viên lưu danh mục bài, để tải lại số liệu. */
  reloadKey: number;
  onAssign: () => void;
}

/** Tổng quan học tập theo lớp: bấm dòng để xem chi tiết từng học viên hoặc bài tập. */
const OverviewView: React.FC<OverviewProps> = ({ classes, classId, setClassId, reloadKey, onAssign }) => {
  const [overview, setOverview] = useState<ClassOverview | null>(null);
  const [tab, setTab] = useState<Tab>('students');
  const [selection, setSelection] = useState<Selection>(null);
  const [detail, setDetail] = useState<StudentDetail | ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelection(null);
    setDetail(null);
    teacherAnalyticsApi
      .getOverview(classId)
      .then((o) => !cancelled && setOverview(o))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Không tải được số liệu lớp.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [classId, reloadKey]);

  useEffect(() => {
    if (!selection || !classId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    const request =
      selection.kind === 'student'
        ? teacherAnalyticsApi.getStudent(classId, selection.id)
        : teacherAnalyticsApi.getExercise(classId, selection.id);
    request
      .then((d) => !cancelled && setDetail(d))
      .catch((err) => {
        if (cancelled) return;
        setDetail(null);
        setError(errorMessage(err, 'Không tải được chi tiết.'));
      })
      .finally(() => !cancelled && setDetailLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selection, classId]);

  const select = (next: Selection) =>
    setSelection((cur) => (cur && next && cur.kind === next.kind && cur.id === next.id ? null : next));

  if (classes.length === 0) {
    return (
      <p className="py-6 text-sm text-[var(--text-muted)]">Bạn chưa được phân công lớp nào. Liên hệ quản trị viên.</p>
    );
  }

  const state = overview ? dashboardState(overview.summary) : null;
  const s = overview?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Chọn lớp"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className={selectControl}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {overview?.class.description && (
          <span className="text-xs text-[var(--text-muted)]">{overview.class.description}</span>
        )}
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      {loading && !overview ? (
        <div className="flex items-center py-8 text-sm text-[var(--text-muted)]">
          <Loader2 className="mr-2 animate-spin" size={16} /> Đang tải...
        </div>
      ) : overview && s && state ? (
        <>
          <section
            aria-label="Chỉ số chính"
            className={`flex flex-wrap divide-x divide-[var(--border-color)] rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] ${loading ? 'opacity-60' : ''}`}
          >
            <Stat
              label="Hoàn thành"
              value={formatPercent(s.completionRate)}
              note={`${s.passedPairs}/${s.students * s.exercises} lượt bài`}
            />
            <Stat label="Tỷ lệ đạt" value={formatPercent(s.passRate)} note={`${s.passedPairs}/${s.attemptedPairs} đã thử`} />
            <Stat label="Lần thử TB" value={formatAvg(s.avgAttempts)} note={`${s.totalAttempts} lượt`} />
            <Stat label="Dùng gợi ý" value={formatPercent(s.hintUsageRate)} note={`${s.hintUnlocks} gợi ý đã mở`} />
            <Stat label="Quy mô" value={`${s.students}`} note={`học viên, ${s.exercises} bài`} />
          </section>

          {state !== 'READY' ? (
            <Muted>
              {EMPTY_MESSAGE[state]}{' '}
              {state === 'NO_EXERCISES' && (
                <button onClick={onAssign} className="cursor-pointer text-indigo-600 underline dark:text-indigo-400">
                  Giao bài
                </button>
              )}
            </Muted>
          ) : (
            <>
              <section aria-label="Kỹ năng">
                <h2 className="mb-1 text-sm font-medium text-[var(--text-main)]">Kỹ năng khó nhất</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className={`${head} text-left`}>Nhãn</th>
                        <th className={`${head} text-right`}>Bài</th>
                        <th className={`${head} text-right`}>Đạt</th>
                        <th className={`${head} text-right`}>Lần thử TB</th>
                        <th className={`${head} text-right`}>Gợi ý</th>
                        <th className={`${head} text-right`}>Độ khó</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.tags.map((t) => (
                        <tr key={t.tag} className={rule}>
                          <td className={cell}>
                            {t.tag}
                            {t.bottleneck && <span className="ml-2 text-xs text-rose-500">Điểm nghẽn</span>}
                          </td>
                          <td className={num}>{t.exercises}</td>
                          <td className={num}>{formatPercent(t.passRate)}</td>
                          <td className={num}>{formatAvg(t.avgAttempts)}</td>
                          <td className={num}>{formatPercent(t.hintUsageRate)}</td>
                          <td className={num}>
                            {difficultyLabel(t.difficultyScore)}
                            {t.difficultyScore !== null && (
                              <span className="ml-1 text-xs text-[var(--text-muted)]">{t.difficultyScore}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section aria-label="Chi tiết">
                <div className="mb-1 flex gap-4 border-b border-[var(--border-color)]" role="tablist">
                  {(
                    [
                      ['students', 'Học viên'],
                      ['exercises', 'Bài tập'],
                    ] as Array<[Tab, string]>
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={tab === key}
                      onClick={() => {
                        setTab(key);
                        setSelection(null);
                      }}
                      className={`cursor-pointer border-b-2 px-1 pb-2 text-sm ${
                        tab === key
                          ? 'border-indigo-600 font-medium text-[var(--text-main)]'
                          : 'border-transparent text-[var(--text-muted)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {tab === 'students' ? (
                  <DataTable
                    rows={overview.students}
                    columns={studentColumns}
                    rowKey={(r) => r.id}
                    selectedKey={selection?.kind === 'student' ? selection.id : null}
                    onSelect={(r) => select({ kind: 'student', id: r.id })}
                  />
                ) : (
                  <DataTable
                    rows={overview.exercises}
                    columns={exerciseColumns}
                    rowKey={(r) => r.slug}
                    selectedKey={selection?.kind === 'exercise' ? selection.id : null}
                    onSelect={(r) => select({ kind: 'exercise', id: r.slug })}
                  />
                )}
              </section>

              {selection && (
                <section aria-label="Chi tiết đã chọn" className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-sm font-medium text-[var(--text-main)]">
                      {detail && 'student' in detail
                        ? detail.student.name
                        : detail && 'exercise' in detail
                          ? detail.exercise.title
                          : 'Chi tiết'}
                    </h2>
                    <button
                      onClick={() => setSelection(null)}
                      className="cursor-pointer text-xs text-[var(--text-muted)] underline"
                    >
                      Đóng
                    </button>
                  </div>
                  {detailLoading || !detail ? (
                    <div className="flex items-center py-4 text-sm text-[var(--text-muted)]">
                      <Loader2 className="mr-2 animate-spin" size={14} /> Đang tải...
                    </div>
                  ) : 'student' in detail ? (
                    <DetailTable
                      firstHead="Bài tập"
                      rows={detail.exercises.map((e) => ({
                        key: e.slug,
                        name: e.title,
                        status: e.status,
                        attempts: e.attempts,
                        hints: e.hintUnlocks,
                        lastAt: e.lastAt,
                      }))}
                    />
                  ) : (
                    <DetailTable
                      firstHead="Học viên"
                      rows={detail.students.map((st) => ({
                        key: st.id,
                        name: st.name,
                        status: st.status,
                        attempts: st.attempts,
                        hints: st.hintUnlocks,
                        lastAt: st.lastAt,
                      }))}
                    />
                  )}
                </section>
              )}
            </>
          )}
        </>
      ) : null}
    </div>
  );
};

type View = 'overview' | 'assign';

/**
 * Trang giảng viên: tab "Tổng quan lớp" (số liệu học tập) và "Giao bài" (danh mục bài của lớp).
 * Chỉ hiện các lớp được Admin phân công; tạo lớp, thêm học viên do Admin làm ở /admin/classes.
 */
export const TeacherDashboardPage: React.FC = () => {
  const [view, setView] = useState<View>('overview');
  const [classes, setClasses] = useState<ClassSummary[] | null>(null);
  const [classId, setClassId] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    teacherAnalyticsApi
      .getClasses()
      .then((list) => {
        if (cancelled) return;
        setClasses(list);
        setClassId((cur) => (list.some((c) => c.id === cur) ? cur : (list[0]?.id ?? '')));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err, 'Không tải được danh sách lớp.'));
        setClasses((cur) => cur ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="text-xl font-semibold text-[var(--text-main)]">Lớp học</h1>

      <div className="flex gap-4 border-b border-[var(--border-color)]" role="tablist">
        {(
          [
            ['overview', 'Tổng quan lớp'],
            ['assign', 'Giao bài'],
          ] as Array<[View, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={view === key}
            onClick={() => setView(key)}
            className={`cursor-pointer border-b-2 px-1 pb-2 text-sm ${
              view === key
                ? 'border-indigo-600 font-medium text-[var(--text-main)]'
                : 'border-transparent text-[var(--text-muted)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      {classes === null ? (
        <div className="flex items-center py-8 text-sm text-[var(--text-muted)]">
          <Loader2 className="mr-2 animate-spin" size={16} /> Đang tải...
        </div>
      ) : view === 'overview' ? (
        <OverviewView
          classes={classes}
          classId={classId}
          setClassId={setClassId}
          reloadKey={reloadKey}
          onAssign={() => setView('assign')}
        />
      ) : (
        <ClassAssignPanel
          classes={classes}
          selectedId={classId}
          onSelect={setClassId}
          onChanged={() => setReloadKey((k) => k + 1)}
        />
      )}
    </div>
  );
};

export default TeacherDashboardPage;
