import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, Database } from 'lucide-react';
import daLabApi from '../axios/daLabApi';
import type { DaLab, DaLabType } from '../types/daLab';

const SECTION_LABEL: Record<DaLabType, string> = {
  SQL_LAB: 'Bài tập SQL',
  DA_INSIGHT: 'Bài tập Insight',
};

const DIFFICULTY_LABEL: Record<DaLab['difficulty'], string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
};

export const DaLabListPage: React.FC = () => {
  const navigate = useNavigate();
  const [labs, setLabs] = useState<DaLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    daLabApi
      .getLabs()
      .then(setLabs)
      .catch((err) => {
        console.error(err);
        setError('Không tải được danh sách bài lab. Vui lòng thử lại sau.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--text-muted)]">
        <Loader2 className="animate-spin mr-2" size={20} />
        Đang tải danh sách bài lab...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-6 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500">
        <AlertTriangle size={18} />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <Database size={24} />
          Bộ lab Data Analyst
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Viết SQL trên sandbox dữ liệu thật do Data & AI Resource cấp phát, được chấm theo kết quả dữ liệu trả về.
        </p>
      </div>

      {(Object.keys(SECTION_LABEL) as DaLabType[]).map((type) => {
        const items = labs.filter((l) => l.type === type);
        if (items.length === 0) return null;
        return (
          <section key={type}>
            <h2 className="text-lg font-semibold text-[var(--text-main)] mb-3">
              {SECTION_LABEL[type]}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((lab) => (
                <button
                  key={lab.slug}
                  onClick={() => navigate(`/da-labs/${lab.slug}`)}
                  className="text-left rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 hover:border-indigo-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-indigo-600 dark:text-cyan-400">{lab.slug.toUpperCase()}</span>
                    <span className="text-[var(--text-muted)]">
                      {DIFFICULTY_LABEL[lab.difficulty]} · {lab.points}đ
                    </span>
                  </div>
                  <h3 className="font-semibold text-[var(--text-main)] mt-1">{lab.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-3">{lab.description}</p>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default DaLabListPage;
