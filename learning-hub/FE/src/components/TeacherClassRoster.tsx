import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Lock } from 'lucide-react';
import { hairline } from './adminStyles';
import type { CatalogStudent, StudentRow } from '../types/teacherAnalytics';
import type { FinalGrade } from '../types/assessment';
import { finalGradeBadge, outTabSeverity, submissionStatus, type ClassKind } from '../pages/teacherClassesModel';

const th = 'px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] whitespace-nowrap';
const td = 'px-3 py-2 text-sm text-[var(--text-main)]';

/** Cảnh báo rời màn hình của một học viên (gộp các bài thi). */
export interface OutTabInfo {
  count: number;
  exams: string[];
  /** Tổng thời gian rời màn hình (giây) nếu nguồn có đo. */
  seconds: number | null;
}

interface Props {
  kind: ClassKind;
  classId: string;
  students: CatalogStudent[];
  progress: Map<string, StudentRow>;
  totalExercises: number;
  outTab: Map<string, OutTabInfo>;
  /** Điểm tổng kết 30/40/30 theo học viên; null = lớp chưa có bài đánh giá (ẩn các cột điểm). */
  finalGrades: Map<string, FinalGrade> | null;
}

const STATE_STYLE: Record<string, string> = {
  PASSED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  WRONG_ANSWER: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
  NOT_SUBMITTED: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  NO_EXERCISE: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
};

const OutTabBadge: React.FC<{ info: OutTabInfo | undefined }> = ({ info }) => {
  if (!info) return <span className="text-[var(--text-muted)]">Không có</span>;
  const red = outTabSeverity(info.count) === 'RED';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        red ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
      }`}
      title={info.exams.join(', ')}
    >
      <AlertTriangle size={12} aria-hidden /> {info.count} lần{info.seconds ? ` · ${info.seconds}s` : ''}
      {info.exams.length > 0 ? ` · ${info.exams[0]}` : ''}
    </span>
  );
};

const num = (v: number | null) => (v === null ? '—' : String(Math.round(v * 100) / 100));

/** Ô điểm thành phần; ô bài tập tuần có ghi chú khi đã loại bài thấp nhất. */
const ScoreCell: React.FC<{ value: number | null; note?: string }> = ({ value, note }) => (
  <td className={`${td} tabular-nums`} title={note}>
    {num(value)}
    {note && value !== null && <span className="ml-1 cursor-help text-[10px] text-[var(--text-muted)]" aria-label={note}>ⓘ</span>}
  </td>
);

const GradeCell: React.FC<{ g: FinalGrade }> = ({ g }) => {
  const badge = finalGradeBadge(g);
  if (badge.kind === 'LOCKED') {
    return (
      <td className={td}>
        <span title={badge.tooltip} className="inline-flex cursor-help items-center gap-1 whitespace-nowrap rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">
          <Lock size={12} aria-hidden /> {badge.label}
        </span>
      </td>
    );
  }
  return (
    <td className={td}>
      <span className="font-semibold tabular-nums">{num(g.finalScore)}</span>
      <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Hạng {g.letter}</span>
      {badge.kind === 'PROVISIONAL' && (
        <span title={badge.tooltip} className="ml-2 cursor-help whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {badge.label}
        </span>
      )}
    </td>
  );
};

/**
 * Khối 6-12 và Người đi làm: trạng thái nộp bài, cột cảnh báo out-tab và (khi lớp có bài đánh giá) bảng điểm tổng kết
 * Bài tập tuần 30% | Cuộc thi 40% | Thi kết thúc 30% | Tổng kết & Xếp loại. Khối 3-5 dùng KidJourneyPanel.
 */
export const TeacherClassRoster: React.FC<Props> = ({ kind, students, progress, totalExercises, outTab, finalGrades }) => {
  const withGrades = finalGrades !== null;
  // Người đi làm (Career Adult) không bị đo out-tab: bỏ cột cảnh báo.
  const showOutTab = kind !== 'CAREER';
  const head = [
    'Học viên',
    ...(withGrades ? ['Bài tập tuần (30%)', 'Cuộc thi (40%)', 'Thi kết thúc (30%)', 'Tổng kết / Xếp loại'] : ['Email']),
    'Trạng thái nộp bài',
    ...(showOutTab ? ['Cảnh báo out-tab'] : []),
  ];
  return (
    <div className="space-y-4">
      {kind === 'CAREER' && (
        <section aria-label="Công cụ chấm bài" className={`flex flex-wrap items-center gap-3 rounded-lg border p-4 text-sm ${hairline}`}>
          <span className="text-[var(--text-main)]">Bài nộp Tester QA đang chờ chấm nằm ở mục Chấm bài.</span>
          <Link to="/teacher/grading" className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700">
            Mở hàng chờ chấm
          </Link>
        </section>
      )}
      <div className={`overflow-x-auto rounded-lg border ${hairline}`}>
        <table className="min-w-full">
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={head.length} className={`${td} text-[var(--text-muted)]`}>
                  Lớp chưa có học viên.
                </td>
              </tr>
            ) : (
              students.map((s) => {
                const st = submissionStatus(progress.get(s.id), totalExercises);
                const g = finalGrades?.get(s.id);
                return (
                  <tr key={s.id} className={`border-t ${hairline}`}>
                    <td className={td}>
                      <div>{s.name}</div>
                      {withGrades && <div className="text-xs text-[var(--text-muted)]">{s.email}</div>}
                    </td>
                    {withGrades ? (
                      g ? (
                        <>
                          <ScoreCell value={g.assignmentAvg} note={g.droppedAssignmentId ? 'Đã loại bỏ 1 bài thấp nhất' : undefined} />
                          <ScoreCell value={g.contestAvg} />
                          <ScoreCell value={g.examScore} />
                          <GradeCell g={g} />
                        </>
                      ) : (
                        <td colSpan={4} className={`${td} text-[var(--text-muted)]`}>
                          —
                        </td>
                      )
                    ) : (
                      <td className={td}>{s.email}</td>
                    )}
                    <td className={td}>
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATE_STYLE[st.state]}`}>{st.label}</span>
                    </td>
                    {showOutTab && (
                      <td className={td}>
                        <OutTabBadge info={outTab.get(s.id)} />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherClassRoster;
