import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Briefcase, Database, FlaskConical } from 'lucide-react';

export interface CareerLabCard {
  key: string;
  title: string;
  desc: string;
  path: string;
  cta: string;
  Icon: typeof Database;
  gradient: string;
}

/** 3 phòng thực hành dành cho Người đi làm / Trái ngành (dữ liệu bài lab có sẵn trong hệ thống). */
export const CAREER_LAB_CARDS: CareerLabCard[] = [
  {
    key: 'data-lab',
    title: 'Data Lab (SQL)',
    desc: 'Viết truy vấn SQL trên bộ dữ liệu bán hàng mẫu (khách hàng, đơn hàng, sản phẩm). Chạy thử và nộp bài, hệ thống so kết quả với đáp án mẫu.',
    path: '/da-labs',
    cta: 'Vào Data Lab',
    Icon: Database,
    gradient: 'from-sky-600 to-cyan-500',
  },
  {
    key: 'ai-lab',
    title: 'AI Lab (Prompting)',
    desc: 'Luyện viết prompt: gán vai trò, ràng buộc định dạng, few-shot, RAG, chống prompt injection. Prompt của bạn được chạy thật trên mô hình AI.',
    path: '/ai-labs',
    cta: 'Vào AI Lab',
    Icon: Bot,
    gradient: 'from-violet-600 to-fuchsia-500',
  },
  {
    key: 'tester-lab',
    title: 'Tester Lab',
    desc: 'Thiết kế test case và viết báo cáo lỗi (bug report) cho tình huống thực tế. Nộp bài để giảng viên chấm, kèm nhận xét sơ bộ ngay lập tức.',
    path: '/tester-labs',
    cta: 'Vào Tester Lab',
    Icon: FlaskConical,
    gradient: 'from-emerald-600 to-teal-500',
  },
];

/** Hub dẫn vào 3 phòng lab; trang đích sau đăng nhập của tài khoản Người đi làm / Trái ngành. */
export const CareerLabsPage: React.FC = () => (
  <div className="mx-auto max-w-5xl space-y-6">
    <div className="space-y-1">
      <h1 className="flex items-center gap-2 text-2xl font-black text-[var(--text-main)]">
        <Briefcase size={24} /> Phòng thực hành chuyên ngành
      </h1>
      <p className="text-sm text-[var(--text-muted)]">Chọn một phòng lab để bắt đầu luyện tập kỹ năng nghề nghiệp.</p>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {CAREER_LAB_CARDS.map(({ key, title, desc, path, cta, Icon, gradient }) => (
        <section key={key} aria-label={title} className="flex flex-col gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-xs">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
            <Icon size={24} strokeWidth={2} aria-hidden="true" />
          </div>
          <h2 className="text-lg font-extrabold text-[var(--text-main)]">{title}</h2>
          <p className="flex-1 text-sm leading-relaxed text-[var(--text-muted)]">{desc}</p>
          <Link
            to={path}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-indigo-500"
          >
            {cta}
          </Link>
        </section>
      ))}
    </div>
  </div>
);

export default CareerLabsPage;
