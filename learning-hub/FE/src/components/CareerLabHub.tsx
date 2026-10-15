import React from 'react';
import { ArrowLeft, Bug, Database, Sparkles } from 'lucide-react';

interface CareerLabHubProps {
  onBack: () => void;
  onOpen: (path: string) => void;
}

const LABS = [
  {
    key: 'DATA_SQL',
    title: 'Data Lab (SQL)',
    desc: 'Viết truy vấn SQL trên dataset mẫu và phân tích số liệu.',
    path: '/da-labs',
    Icon: Database,
    gradient: 'from-sky-600 to-indigo-600',
  },
  {
    key: 'AI_PROMPT',
    title: 'AI Lab (Prompting)',
    desc: 'Thiết kế prompt, so sánh kết quả và tối ưu chi phí.',
    path: '/ai-labs',
    Icon: Sparkles,
    gradient: 'from-violet-600 to-fuchsia-600',
  },
  {
    key: 'TESTER_QA',
    title: 'Tester Lab (Bug Report)',
    desc: 'Tìm lỗi trên ứng dụng mẫu và viết báo cáo lỗi chuẩn.',
    path: '/tester-labs',
    Icon: Bug,
    gradient: 'from-emerald-600 to-teal-600',
  },
] as const;

/** Danh mục phòng thực hành của khối Người lớn / Chuyên ngành (CAREER_ADULT). */
export const CareerLabHub: React.FC<CareerLabHubProps> = ({ onBack, onOpen }) => (
  <div className="flex flex-col gap-4" data-testid="career-lab-hub">
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-xs">
      <button
        onClick={onBack}
        aria-label="Quay lại chọn lớp"
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]"
      >
        <ArrowLeft size={16} strokeWidth={2} />
      </button>
      <div>
        <h1 className="text-base font-extrabold tracking-tight text-[var(--text-main)]">Người lớn / Chuyên ngành</h1>
        <p className="text-xs text-[var(--text-muted)]">Chọn một phòng thực hành.</p>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {LABS.map(({ key, title, desc, path, Icon, gradient }) => (
        <button
          key={key}
          onClick={() => onOpen(path)}
          className="flex cursor-pointer flex-col items-start gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 text-left transition-all hover:border-indigo-500 hover:shadow-md"
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
            <Icon size={24} strokeWidth={2} />
          </div>
          <div className="text-base font-extrabold text-[var(--text-main)]">{title}</div>
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">{desc}</p>
        </button>
      ))}
    </div>
  </div>
);
