import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, FlaskConical, ExternalLink } from 'lucide-react';
import testerLabApi from '../axios/testerLabApi';
import type { TesterLab, TesterLabCategory } from '../types/testerLab';

const CATEGORY_LABEL: Record<TesterLabCategory, string> = {
  BUG_REPORT: 'Bug Report',
  TEST_CASE_DESIGN: 'Test Case Design',
  API_TESTING: 'API Testing',
};

export const TesterLabListPage: React.FC = () => {
  const navigate = useNavigate();
  const [labs, setLabs] = useState<TesterLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testerLabApi
      .getLabs()
      .then(setLabs)
      .catch((err) => {
        console.error(err);
        setError('Không tải được danh sách lab. Vui lòng thử lại sau.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--text-muted)]">
        <Loader2 className="animate-spin mr-2" size={20} />
        Đang tải danh sách lab...
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
          <FlaskConical size={24} />
          Bộ lab Tester
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Chọn một lab, làm trên môi trường demo rồi nộp artifact để được chấm theo rubric.
        </p>
      </div>

      {(Object.keys(CATEGORY_LABEL) as TesterLabCategory[]).map((category) => {
        const items = labs.filter((l) => l.category === category);
        if (items.length === 0) return null;
        return (
          <section key={category}>
            <h2 className="text-lg font-semibold text-[var(--text-main)] mb-3">
              {CATEGORY_LABEL[category]}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((lab) => (
                <button
                  key={lab.labCode}
                  onClick={() => navigate(`/tester-labs/${lab.labCode}`)}
                  className="text-left rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 hover:border-indigo-500 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400">
                    {lab.labCode}
                  </span>
                  <h3 className="font-semibold text-[var(--text-main)] mt-1">{lab.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-3">
                    {lab.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] mt-3">
                    <ExternalLink size={12} />
                    {lab.environmentUrl}
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default TesterLabListPage;
