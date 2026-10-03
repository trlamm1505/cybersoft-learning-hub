import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, BrainCircuit } from 'lucide-react';
import aiLabApi from '../axios/aiLabApi';
import type { AiLabSummary } from '../types/aiLab';

const DIFFICULTY_LABEL: Record<AiLabSummary['difficulty'], string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
};

export const AiLabListPage: React.FC = () => {
  const navigate = useNavigate();
  const [labs, setLabs] = useState<AiLabSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    aiLabApi
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <BrainCircuit size={24} />
          Bộ lab AI Engineer
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Viết prompt, chọn model và cấu hình RAG; bài được chấm trên evaluation set của Data & AI Resource theo cả
          chất lượng lẫn chi phí, độ trễ.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labs.map((lab) => (
          <button
            key={lab.slug}
            onClick={() => navigate(`/ai-labs/${lab.slug}`)}
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
            <div className="text-xs font-mono text-[var(--text-muted)] mt-3 opacity-80">{lab.resource_id}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AiLabListPage;
