import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, School } from 'lucide-react';
import teacherAnalyticsApi from '../axios/teacherAnalyticsApi';
import integrityApi from '../axios/integrityApi';
import assessmentApi from '../axios/assessmentApi';
import { KidJourneyPanel } from '../components/KidJourneyPanel';
import { TesterClassPanel } from '../components/TesterClassPanel';
import type { FinalGrade } from '../types/assessment';
import { hairline } from '../components/adminStyles';
import { ClassDaysPanel } from '../components/ClassDaysPanel';
import { CareerLabClassPanel } from '../components/CareerLabClassPanel';
import { TeacherClassRoster, type OutTabInfo } from '../components/TeacherClassRoster';
import type { ClassDetail, ClassOverview, TeacherClassSummary } from '../types/teacherAnalytics';
import { ageGroupLabel, classGroupIcon, classKind, isSandboxSummary, isTesterSummary, NO_CLASS_MESSAGE, resolveClassId } from './teacherClassesModel';

type SubTab = 'track' | 'assign';

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/**
 * Tab "Lớp học của tôi": chọn lớp (đồng bộ ?classId=) rồi làm việc trong 2 tab con duy nhất:
 * "Theo dõi học viên" (sao/ải/vinh danh cho K3-5, trạng thái nộp bài + out-tab cho K6-12 và người lớn)
 * và "Bài tập & Giao bài" (danh sách bài kèm trạng thái, giao bài mới từ ngân hàng đề ngay tại chỗ).
 */
export const TeacherClassesPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [classes, setClasses] = useState<TeacherClassSummary[] | null>(null);
  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [overview, setOverview] = useState<ClassOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outTab, setOutTab] = useState<Map<string, OutTabInfo>>(new Map());
  const [tab, setTab] = useState<SubTab>('track');
  const [reloadKey, setReloadKey] = useState(0);
  const [finalGrades, setFinalGrades] = useState<Map<string, FinalGrade> | null>(null);

  useEffect(() => {
    let cancelled = false;
    teacherAnalyticsApi
      .getClasses()
      .then((list) => !cancelled && setClasses(list))
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err, 'Không tải được danh sách lớp.'));
        setClasses([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const classId = classes ? resolveClassId(classes, params.get('classId')) : '';

  // Đổi lớp từ sidebar thì về tab Theo dõi học viên.
  useEffect(() => setTab('track'), [classId]);

  // URL luôn phản ánh lớp đang xem (kể cả khi classId trên URL không hợp lệ hoặc chưa có).
  useEffect(() => {
    if (!classes || !classId || params.get('classId') === classId) return;
    setParams({ classId }, { replace: true });
  }, [classes, classId, params, setParams]);

  // Lớp Tester QA có luồng riêng (TesterClassPanel tự tải dữ liệu từ bài nộp Tester Lab), không dùng chi tiết lớp phổ thông.
  const isTester = isTesterSummary(classes?.find((c) => c.id === classId));
  const isSandbox = isSandboxSummary(classes?.find((c) => c.id === classId));
  // Lớp Career có luồng riêng (không dùng chi tiết lớp phổ thông).
  const isCareerFlow = isTester || isSandbox;

  useEffect(() => {
    if (!classId || isCareerFlow) {
      setDetail(null);
      setOverview(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setError(null);
    Promise.all([teacherAnalyticsApi.getClassDetail(classId), teacherAnalyticsApi.getOverview(classId)])
      .then(([d, o]) => {
        if (cancelled) return;
        setDetail(d);
        setOverview(o);
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Không tải được chi tiết lớp.')));
    return () => {
      cancelled = true;
    };
  }, [classId, reloadKey, isCareerFlow]);

  const current = classes?.find((c) => c.id === classId) ?? null;
  const kind = classKind(current?.ageGroup);
  const progress = useMemo(() => new Map((overview?.students ?? []).map((s) => [s.id, s])), [overview]);

  // Cảnh báo out-tab đang mở của học viên trong lớp (khối 6-12 và người lớn), gộp theo học viên.
  useEffect(() => {
    setOutTab(new Map());
    // Học viên Career Adult (kể cả Tester QA) không bị đo out-tab: không lấy cảnh báo.
    if (!detail || kind === 'KID' || kind === 'CAREER') return;
    let cancelled = false;
    const members = new Set(detail.students.map((s) => s.id));
    // Chỉ cảnh báo của bài tập được giao TRONG lớp này (lọc ở BE theo classId + kind). Cuộc thi là sự kiện chung: không đưa vào bảng lớp.
    integrityApi
      .getAlerts(undefined, detail.id)
      .then((rows) => {
        if (cancelled) return;
        const m = new Map<string, OutTabInfo>();
        for (const r of rows) {
          if (r.kind !== 'CLASS_ASSIGNMENT' || r.classId !== detail.id || !members.has(r.student.id)) continue;
          const cur = m.get(r.student.id) ?? { count: 0, exams: [], seconds: null };
          cur.count += r.leaveCount;
          if (typeof r.awaySeconds === 'number') cur.seconds = (cur.seconds ?? 0) + r.awaySeconds;
          if (r.refTitle && !cur.exams.includes(r.refTitle)) cur.exams.push(r.refTitle);
          m.set(r.student.id, cur);
        }
        setOutTab(m);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [detail, kind]);

  // Điểm tổng kết 30/40/30 từ module assessment (khối 6-12 và người lớn). Lớp chưa có bài đánh giá -> null (ẩn cột điểm).
  useEffect(() => {
    setFinalGrades(null);
    if (!classId || kind === 'KID' || isCareerFlow) return;
    let cancelled = false;
    assessmentApi
      .getClassFinalGrades(classId)
      .then((r) => {
        if (cancelled || r.assessmentCount === 0) return;
        setFinalGrades(new Map(r.students.map((g) => [g.studentId, g])));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [classId, kind, reloadKey, isCareerFlow]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  if (classes === null) {
    return (
      <div className="flex items-center py-8 text-sm text-[var(--text-muted)]">
        <Loader2 className="mr-2 animate-spin" size={16} /> Đang tải...
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 py-16 text-center">
        <School className="mx-auto text-[var(--text-muted)]" size={36} strokeWidth={1.5} />
        <h1 className="text-lg font-semibold text-[var(--text-main)]">Chưa có lớp học</h1>
        <p className="text-sm text-[var(--text-muted)]">{NO_CLASS_MESSAGE}</p>
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Chọn lớp nằm ở sidebar (accordion "Lớp học của tôi"); trang này chỉ hiển thị lớp đang chọn theo ?classId=. */}
      {current && (
        <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold text-[var(--text-main)]">
          <span aria-hidden>{classGroupIcon(current.ageGroup)}</span> {current.name}
          {current.status === 'ARCHIVED' && (
            <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">Đã lưu trữ</span>
          )}
        </h1>
      )}

      {current && (
        <p className="text-sm text-[var(--text-muted)]">
          {current.code && <span className="font-medium text-[var(--text-main)]">{current.code} · </span>}
          {[ageGroupLabel(current.ageGroup), `${current.studentCount} học viên`, current.isPrimaryTeacher ? 'Giảng viên chính' : 'Trợ giảng', ...(current.coTeachers.length > 0 ? [`cùng phụ trách: ${current.coTeachers.join(', ')}`] : [])].join(' · ')}
        </p>
      )}

      {kind !== 'KID' && !isCareerFlow && (
      <div role="tablist" aria-label="Nội dung lớp" className={`flex gap-4 border-b ${hairline}`}>
        {(
          [
            ['track', 'Theo dõi học viên'],
            ['assign', 'Bài tập & Giao bài'],
          ] as Array<[SubTab, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`cursor-pointer border-b-2 px-1 pb-2 text-sm ${
              tab === key ? 'border-indigo-600 font-medium text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      )}

      {error && <p className="text-sm text-rose-500">{error}</p>}

      {isSandbox && classId ? (
        // Data SQL / AI Prompt: chỉ theo dõi, không giao bài, không out-tab, không chấm thủ công.
        <CareerLabClassPanel classId={classId} />
      ) : isTester && classId ? (
        // Không có tab Bài tập & Giao bài, không có cột out-tab: xếp hạng + hàng chờ chấm ngay trong lớp.
        <TesterClassPanel classId={classId} onPendingChange={() => teacherAnalyticsApi.getClasses().then(setClasses).catch(() => undefined)} />
      ) : !error && !detail ? (
        <div className="flex items-center py-6 text-sm text-[var(--text-muted)]">
          <Loader2 className="mr-2 animate-spin" size={16} /> Đang tải chi tiết lớp...
        </div>
      ) : detail ? (
        kind === 'KID' ? (
          // Lớp nhí không có bài tập code: không có tab Bài tập & Giao bài, chỉ có hành trình vượt ải.
          <KidJourneyPanel classId={classId} students={detail.students} />
        ) : tab === 'track' ? (
          <section aria-label="Theo dõi học viên">
            <TeacherClassRoster
              kind={kind}
              classId={classId}
              students={detail.students}
              progress={progress}
              totalExercises={detail.exercises.length}
              outTab={outTab}
              finalGrades={finalGrades}
            />
          </section>
        ) : (
          <ClassDaysPanel classId={classId} onChanged={reload} />
        )
      ) : null}
    </div>
  );
};

export default TeacherClassesPage;
