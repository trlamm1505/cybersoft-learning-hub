import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export const BACK_TO_LAB_LIST_LABEL = '⬅ Quay lại danh sách bài Lab';

export type LabGroup = 'DATA' | 'AI' | 'TESTER';

export const LAB_GROUPS: Record<LabGroup, { name: string; listPath: string }> = {
  DATA: { name: 'Data Lab (SQL)', listPath: '/da-labs' },
  AI: { name: 'AI Lab (Prompting)', listPath: '/ai-labs' },
  TESTER: { name: 'Tester Lab', listPath: '/tester-labs' },
};

/** Thanh điều hướng đầu bài lab: nút quay lại rõ ràng + breadcrumb Phòng thực hành chuyên ngành > [Lab] > [Bài]. */
export const LabBreadcrumb: React.FC<{ group: LabGroup; title: string }> = ({ group, title }) => {
  const navigate = useNavigate();
  const { name, listPath } = LAB_GROUPS[group];
  return (
    <div className="space-y-2" data-testid="lab-breadcrumb">
      <button
        type="button"
        onClick={() => navigate(listPath)}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
      >
        {BACK_TO_LAB_LIST_LABEL}
      </button>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-[var(--text-muted)]">
        <Link to="/career-labs" className="text-[var(--text-muted)] no-underline hover:text-[var(--text-main)]">
          Phòng thực hành chuyên ngành
        </Link>
        <ChevronRight size={12} aria-hidden="true" />
        <Link to={listPath} className="text-[var(--text-muted)] no-underline hover:text-[var(--text-main)]">
          {name}
        </Link>
        <ChevronRight size={12} aria-hidden="true" />
        <span aria-current="page" className="font-semibold text-[var(--text-main)]">
          {title}
        </span>
      </nav>
    </div>
  );
};

export default LabBreadcrumb;
